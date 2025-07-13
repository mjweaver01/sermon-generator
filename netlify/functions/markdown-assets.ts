import { promises as fs } from 'fs'
import { join } from 'path'

export const handler = async (event: any, context: any) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'audio/mpeg',
      },
      body: '',
    }
  }

  // Only handle GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  // Get filename from the path
  const pathSegments = event.path.split('/')
  const filename = pathSegments[pathSegments.length - 1]

  if (!filename || !filename.endsWith('.mp3')) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Invalid audio file request' }),
    }
  }

  try {
    // Try different path approaches for finding audio files
    const pathsToTry = [
      // For local development
      join(process.cwd(), 'netlify', 'functions', 'markdown-assets', filename),
      // For Netlify serverless functions with included files
      join(__dirname, filename),
      join(__dirname, '..', 'markdown-assets', filename),
      // Alternative Netlify paths
      process.env.LAMBDA_TASK_ROOT
        ? join(process.env.LAMBDA_TASK_ROOT, 'markdown-assets', filename)
        : null,
      process.env.LAMBDA_TASK_ROOT
        ? join(process.env.LAMBDA_TASK_ROOT, filename)
        : null,
    ].filter(Boolean) as string[]

    console.log(`Looking for audio file: ${filename}`)
    console.log('Trying paths:', pathsToTry)

    let audioBuffer: Buffer | null = null
    let found = false

    for (const path of pathsToTry) {
      try {
        console.log(`Trying to read file: ${path}`)
        audioBuffer = await fs.readFile(path)
        console.log(`Successfully read audio file from: ${path}`)
        found = true
        break // Success, stop trying other paths
      } catch (error: any) {
        console.log(`Path ${path} failed:`, error.message)
        continue // Try next path
      }
    }

    if (!found || !audioBuffer) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: `Audio file '${filename}' not found`,
        }),
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
      body: audioBuffer.toString('base64'),
      isBase64Encoded: true,
    }
  } catch (error) {
    console.error('Error reading audio file:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to read audio file' }),
    }
  }
}
