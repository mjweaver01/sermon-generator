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

    // Function to convert markdown to plain text while preserving structure for voice inflection
    const markdownToPlainText = (markdown: string): string => {
      return (
        markdown
          // Remove audio shortcodes (these would be read as literal text)
          .replace(/\[audio:[^\]]+\]/g, '')
          // Remove code blocks (these often contain syntax that doesn't read well)
          .replace(/```[\s\S]*?```/g, '')
          .replace(/`([^`]+)`/g, '$1')
          // Remove image alt text syntax (but keep the alt text)
          .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
          // Remove URLs from links (but keep the link text)
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          // Clean up excessive whitespace but preserve paragraph structure
          .replace(/\n{4,}/g, '\n\n\n')
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

    // Generate a unique filename for the audio file
    const timestamp = Date.now()
    const filename = `audio_${timestamp}_${voice}.mp3`

    // Save the audio buffer to markdown-assets folder
    const audioFilePath = `./netlify/functions/markdown-assets/${filename}`
    try {
      await (globalThis as any).Deno.writeFile(
        audioFilePath,
        new Uint8Array(audioBuffer)
      )
      console.log(`Audio saved to: ${audioFilePath}`)
    } catch (writeError: any) {
      console.error('Error saving audio file:', writeError)
      // If we can't save the file, we'll still return the buffer but no URL
    }

    // Create the URL for the saved audio file
    const audioUrl = `/api/markdown-assets/${filename}`

    return new Response(
      JSON.stringify({
        audioUrl: audioUrl,
        audioBuffer: Array.from(new Uint8Array(audioBuffer)),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      }
    )
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
