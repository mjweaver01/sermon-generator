import OpenAI from 'openai'
import { getStore } from '@netlify/blobs'

// Get Netlify Blobs store with proper configuration
const getNetlifyStore = (storeName: string) => {
  // Check if running in Netlify production environment
  if ((globalThis as any).Netlify) {
    return getStore(storeName)
  }

  // For local development, need explicit configuration
  const siteId = (globalThis as any).Deno?.env?.get('NETLIFY_SITE_ID')
  const token = (globalThis as any).Deno?.env?.get('NETLIFY_AUTH_TOKEN')

  if (!siteId || !token) {
    console.warn(
      'Netlify Blobs requires NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN environment variables for local development'
    )
    return null
  }

  return getStore({
    name: storeName,
    siteID: siteId,
    token: token,
  })
}

// Save audio to Netlify Blobs
const saveToNetlifyBlobs = async (
  filename: string,
  audioBuffer: ArrayBuffer
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const store = getNetlifyStore('audio')
    if (!store) {
      return {
        success: false,
        error: 'Netlify Blobs not configured',
      }
    }

    // Save the audio buffer to Netlify Blobs
    await store.set(filename, audioBuffer, {
      metadata: { contentType: 'audio/mpeg' },
    })

    // Return the public URL for the blob
    const blobUrl = `${(globalThis as any).Deno?.env?.get('URL') || 'https://your-site.netlify.app'}/.netlify/blobs/serve/audio/${filename}`

    return {
      success: true,
      url: blobUrl,
    }
  } catch (error) {
    console.error('Error saving to Netlify Blobs:', error)
    return {
      success: false,
      error: 'Failed to save to Netlify Blobs',
    }
  }
}

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
          // Remove audio shortcodes first
          .replace(/\[audio:[^\]]+\]/g, '')
          // Remove code blocks
          .replace(/```[\s\S]*?```/g, '')
          .replace(/`([^`]+)`/g, '$1')
          // Convert headers to text with extra spacing for natural pauses
          .replace(/^#{1,6}\s+(.+)$/gm, '\n\n$1\n\n')
          // Remove emphasis but keep the text
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/__(.*?)__/g, '$1')
          .replace(/_(.*?)_/g, '$1')
          // Remove links but keep the text
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          // Remove images
          .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
          // Convert blockquotes to text with natural pauses
          .replace(/^>\s+(.+)$/gm, '\n$1\n')
          // Remove horizontal rules but add pause spacing
          .replace(/^---+$/gm, '\n\n')
          // Convert list items to natural speech with pauses
          .replace(/^\s*[-*+]\s+(.+)$/gm, '$1.\n')
          .replace(/^\s*\d+\.\s+(.+)$/gm, '$1.\n')
          // Preserve paragraph breaks and natural spacing
          .replace(/\n{3,}/g, '\n\n\n')
          // Clean up leading/trailing whitespace but preserve internal structure
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

    // Generate a unique filename for the audio file
    const timestamp = Date.now()
    const filename = `audio_${timestamp}_${voice}.mp3`

    // Try to save to Netlify Blobs first (for production)
    let audioUrl = `/audio/${filename}` // Default fallback URL
    let savedToBlobs = false

    try {
      const blobResult = await saveToNetlifyBlobs(filename, audioBuffer)
      if (blobResult.success && blobResult.url) {
        audioUrl = blobResult.url
        savedToBlobs = true
        console.log(`Audio saved to Netlify Blobs: ${filename}`)
      } else {
        console.warn('Failed to save to Netlify Blobs:', blobResult.error)
      }
    } catch (blobError) {
      console.warn('Error saving to Netlify Blobs:', blobError)
    }

    // Save to local file system (for development or as fallback)
    if (!savedToBlobs || !(globalThis as any).Netlify) {
      const audioFilePath = `./public/audio/${filename}`
      try {
        await (globalThis as any).Deno.writeFile(
          audioFilePath,
          new Uint8Array(audioBuffer)
        )
        console.log(`Audio saved locally to: ${audioFilePath}`)
        // Use local URL if not saved to blobs
        if (!savedToBlobs) {
          audioUrl = `/audio/${filename}`
        }
      } catch (writeError: any) {
        console.error('Error saving audio file locally:', writeError)
        // If both blob and local saving failed, this is a problem
        if (!savedToBlobs) {
          throw new Error('Failed to save audio file to any storage location')
        }
      }
    }

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
