import type { Handler, HandlerResponse } from '@netlify/functions'

const handler: Handler = async (event, context): Promise<HandlerResponse> => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const { question, biblicalContext } = JSON.parse(event.body || '{}')
    
    if (!question?.trim()) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Question is required' }),
      }
    }

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'OpenAI API key not configured' }),
      }
    }

    // Import OpenAI dynamically
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey })

    const systemPrompt = `
      You are a passionate Protestant preacher. 
      Craft a sermon in markdown format that speaks to the heart of the faithful. 
      Use a dynamic, engaging preaching style with biblical references, and a powerful call to action. 
      Ensure the sermon is biblically grounded, emotionally compelling, and relevant to contemporary Christian life.
    `

    const userPrompt = `${question.trim()}${biblicalContext?.trim() ? '\n\nAdditional Biblical Context:\n' + biblicalContext.trim() : ''}`

    // Since Netlify Functions don't support streaming, we'll get the full response
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
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
      stream: false
    })

    const content = response.choices[0]?.message?.content || ''

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    }

  } catch (error) {
    console.error('Error generating sermon:', error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Failed to generate sermon' }),
    }
  }
}

export { handler } 