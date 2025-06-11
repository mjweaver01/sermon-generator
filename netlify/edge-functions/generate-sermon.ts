export default async (request: Request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  // Only handle POST requests
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Parse request body
    const { question, biblicalContext } = await request.json();
    
    if (!question?.trim()) {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Check for OpenAI API key - use globalThis for Deno env
    const apiKey = (globalThis as any).Deno?.env?.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const systemPrompt = `
      You are a passionate Protestant preacher. 
      Craft a sermon in markdown format that speaks to the heart of the faithful. 
      Use a dynamic, engaging preaching style with biblical references, and a powerful call to action. 
      Ensure the sermon is biblically grounded, emotionally compelling, and relevant to contemporary Christian life.
    `;

    const userPrompt = `${question.trim()}${
      biblicalContext?.trim() 
        ? '\n\nAdditional Biblical Context:\n' + biblicalContext.trim() 
        : ''
    }`;

    // Make request to OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2048,
        stream: true
      })
    });

    if (!openaiResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to generate sermon" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Set up streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = openaiResponse.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Send completion signal
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`)
              );
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                if (jsonStr.trim() === '[DONE]') {
                  continue;
                }
                
                try {
                  const data = JSON.parse(jsonStr);
                  const content = data.choices?.[0]?.delta?.content || '';
                  
                  if (content) {
                    controller.enqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
                    );
                  }
                } catch (e) {
                  // Skip invalid JSON
                  continue;
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`)
          );
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control, Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });

  } catch (error) {
    console.error('Error in sermon generation:', error);
    return new Response(
      JSON.stringify({ error: "Failed to generate sermon" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

export const config = {
  path: "/api/generate-sermon"
}; 