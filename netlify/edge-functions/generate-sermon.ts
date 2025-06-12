import OpenAI from "openai";

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

    // Initialize OpenAI client
    const client = new OpenAI({
      apiKey: apiKey
    });

    const systemContext = `
      You are a passionate Protestant preacher. 
      Craft a sermon in markdown format that speaks to the heart of the faithful. 
      Use a dynamic, engaging preaching style with biblical references, and a powerful call to action. 
      Ensure the sermon is biblically grounded, emotionally compelling, and relevant to contemporary Christian life.
      Use the web search tool to find current events, news, or contemporary examples that can help illustrate biblical principles and make the sermon more relevant to today's world.
    `;

    const input = `${systemContext}\n\nSermon Topic: ${question.trim()}${
      biblicalContext?.trim() 
        ? '\n\nAdditional Biblical Context:\n' + biblicalContext.trim() 
        : ''
    }`;

    // Create response using OpenAI responses API with web search
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      tools: [{ type: "web_search_preview" }],
      input: input,
      stream: true
    });

    // Set up streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of response) {
            // Handle different event types from responses API
            if ('delta' in event && event.delta) {
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ content: event.delta })}\n\n`)
              );
            }
          }
          
          // Final completion signal
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          );
          
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