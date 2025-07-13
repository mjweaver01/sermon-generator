import OpenAI from 'openai'

export default async (request: Request) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  // Only handle POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Parse request body
    const { markdownText, voice = 'alloy' } = await request.json()

    if (!markdownText?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Markdown text is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check for OpenAI API key - use globalThis for Deno env
    const apiKey = (globalThis as any).Deno?.env?.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize OpenAI client
    const client = new OpenAI({
      apiKey: apiKey,
    })

    // Function to convert markdown to plain text
    const markdownToPlainText = (markdown: string): string => {
      return (
        markdown
          // Remove code blocks
          .replace(/```[\s\S]*?```/g, '')
          .replace(/`([^`]+)`/g, '$1')
          // Remove headers
          .replace(/^#{1,6}\s+(.+)$/gm, '$1')
          // Remove emphasis
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/__(.*?)__/g, '$1')
          .replace(/_(.*?)_/g, '$1')
          // Remove links
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          // Remove images
          .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
          // Remove blockquotes
          .replace(/^>\s+(.+)$/gm, '$1')
          // Remove horizontal rules
          .replace(/^---+$/gm, '')
          // Remove list markers
          .replace(/^\s*[-*+]\s+/gm, '')
          .replace(/^\s*\d+\.\s+/gm, '')
          // Clean up extra whitespace
          .replace(/\n\s*\n/g, '\n\n')
          .replace(/^\s+|\s+$/g, '')
          .trim()
      )
    }

    // Convert markdown to plain text
    const plainText = markdownToPlainText(markdownText)

    // Check if text is too long for TTS (OpenAI has a 4096 character limit)
    const maxLength = 4000 // Leave some buffer
    const textToConvert =
      plainText.length > maxLength
        ? plainText.substring(0, maxLength) + '...'
        : plainText

    // Generate speech using OpenAI TTS
    const mp3 = await client.audio.speech.create({
      model: 'tts-1',
      voice: voice as any,
      input: textToConvert,
      response_format: 'mp3',
    })

    // Get the audio buffer
    const audioBuffer = await mp3.arrayBuffer()

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  } catch (error) {
    console.error('Error in audio generation:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate audio' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config = {
  path: '/api/generate-audio',
}
