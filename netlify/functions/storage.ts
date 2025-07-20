import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import * as fs from 'fs'
import * as path from 'path'

// Types for our storage system
interface StorageItem {
  key: string
  content: string
  contentType: string
  lastModified: Date
  source: 'netlify'
}

interface StorageResponse {
  success: boolean
  data?: any
  error?: string
}

// Get Netlify Blobs store with proper configuration
const getNetlifyStore = (storeName: string) => {
  // Check if running in Netlify production environment
  if (process.env.NETLIFY) {
    return getStore(storeName)
  }

  // For local development, need explicit configuration
  const siteId = process.env.NETLIFY_SITE_ID
  const token = process.env.NETLIFY_AUTH_TOKEN

  if (!siteId || !token) {
    throw new Error(
      'Netlify Blobs requires NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN environment variables for local development'
    )
  }

  return getStore({
    name: storeName,
    siteID: siteId,
    token: token,
  })
}

// Main storage operations for Netlify Blobs only
const storageOperations = {
  // Save content to Netlify Blobs
  async saveContent(
    key: string,
    content: string,
    contentType: string,
    storeName: string
  ): Promise<StorageResponse> {
    try {
      const store = getNetlifyStore(storeName)
      await store.set(key, content, { metadata: { contentType } })

      return {
        success: true,
        data: { source: 'netlify', key },
      }
    } catch (error) {
      console.error('Error saving to Netlify Blobs:', error)

      // Check if it's a configuration error
      if (error instanceof Error && error.message.includes('NETLIFY_SITE_ID')) {
        return {
          success: false,
          error:
            'Netlify Blobs not configured. Please set NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN environment variables.',
        }
      }

      return {
        success: false,
        error: 'Failed to save to Netlify Blobs',
      }
    }
  },

  // Get content from Netlify Blobs
  async getContent(key: string, storeName: string): Promise<StorageResponse> {
    try {
      const store = getNetlifyStore(storeName)

      // Handle audio files as binary data
      if (storeName === 'audio') {
        const audioBuffer = await store.get(key, { type: 'arrayBuffer' })

        if (audioBuffer) {
          // Convert ArrayBuffer to base64 for Netlify Functions
          const uint8Array = new Uint8Array(audioBuffer)
          const binaryString = Array.from(uint8Array, byte =>
            String.fromCharCode(byte)
          ).join('')
          const base64Content = Buffer.from(binaryString, 'binary').toString(
            'base64'
          )

          return {
            success: true,
            data: {
              audioBase64: base64Content,
              key,
              source: 'netlify',
              contentType: 'audio/mpeg',
              lastModified: new Date(),
            },
          }
        }
      } else {
        // Handle text content (sermons) as before
        const blob = await store.get(key, { type: 'text' })

        if (blob) {
          return {
            success: true,
            data: {
              content: blob,
              key,
              source: 'netlify',
              lastModified: new Date(),
            },
          }
        }
      }

      return {
        success: false,
        error: 'Content not found in Netlify Blobs',
      }
    } catch (error) {
      console.error('Error getting from Netlify Blobs:', error)

      // Check if it's a configuration error
      if (error instanceof Error && error.message.includes('NETLIFY_SITE_ID')) {
        return {
          success: false,
          error:
            'Netlify Blobs not configured. Please set NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN environment variables.',
        }
      }

      return {
        success: false,
        error: 'Failed to get from Netlify Blobs',
      }
    }
  },

  // List all content from Netlify Blobs
  async listContent(storeName: string): Promise<StorageResponse> {
    try {
      const store = getNetlifyStore(storeName)
      const { blobs } = await store.list()

      const items: StorageItem[] = blobs.map(blob => ({
        key: blob.key,
        content: '', // Content not loaded in list
        contentType: 'text/plain', // Default content type
        lastModified: new Date(), // Use current date since we don't have uploaded_at
        source: 'netlify' as const,
      }))

      return {
        success: true,
        data: { items },
      }
    } catch (error) {
      console.error('Error listing from Netlify Blobs:', error)

      // Check if it's a configuration error
      if (error instanceof Error && error.message.includes('NETLIFY_SITE_ID')) {
        return {
          success: false,
          error:
            'Netlify Blobs not configured. Please set NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN environment variables.',
        }
      }

      return {
        success: false,
        error: 'Failed to list from Netlify Blobs',
      }
    }
  },

  // Delete content from Netlify Blobs
  async deleteContent(
    key: string,
    storeName: string
  ): Promise<StorageResponse> {
    try {
      const store = getNetlifyStore(storeName)
      await store.delete(key)

      return {
        success: true,
        data: { source: 'netlify', key },
      }
    } catch (error) {
      console.error('Error deleting from Netlify Blobs:', error)

      // Check if it's a configuration error
      if (error instanceof Error && error.message.includes('NETLIFY_SITE_ID')) {
        return {
          success: false,
          error:
            'Netlify Blobs not configured. Please set NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN environment variables.',
        }
      }

      return {
        success: false,
        error: 'Failed to delete from Netlify Blobs',
      }
    }
  },
}

// Local file system operations
const localOperations = {
  // Save content to local public/markdown folder
  async saveSermon(
    filename: string,
    content: string
  ): Promise<StorageResponse> {
    try {
      // Ensure filename ends with .md
      const key = filename.endsWith('.md') ? filename : `${filename}.md`

      // Get the absolute path to public/markdown
      const publicDir = path.join(process.cwd(), 'public', 'markdown')
      const filePath = path.join(publicDir, key)

      // Ensure the directory exists
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true })
      }

      // Write the file
      fs.writeFileSync(filePath, content, 'utf8')

      // Regenerate the index.json
      await localOperations.regenerateIndex()

      return {
        success: true,
        data: {
          source: 'local',
          key,
          message: `Sermon saved to public/markdown/${key}`,
        },
      }
    } catch (error) {
      console.error('Error saving sermon locally:', error)
      return {
        success: false,
        error: 'Failed to save sermon to local filesystem',
      }
    }
  },

  // Regenerate the index.json file
  async regenerateIndex(): Promise<void> {
    try {
      const publicDir = path.join(process.cwd(), 'public', 'markdown')
      const indexPath = path.join(publicDir, 'index.json')

      // Read all .md files in the directory
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true })
      }

      const files = fs
        .readdirSync(publicDir)
        .filter(file => file.endsWith('.md') && file !== 'index.json')
        .sort()

      // Write the index.json file
      fs.writeFileSync(indexPath, JSON.stringify(files, null, 2), 'utf8')

      console.log('Index regenerated successfully with files:', files)
    } catch (error) {
      console.error('Error regenerating index:', error)
      throw error
    }
  },
}

// Common headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

// Main Netlify function handler
export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'text/plain',
      },
      body: '',
    }
  }

  const {
    operation,
    store: storeName = 'sermons',
    key,
  } = event.queryStringParameters || {}

  try {
    let result: StorageResponse

    switch (operation) {
      case 'save-local':
        if (event.httpMethod !== 'POST') {
          return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method not allowed' }),
          }
        }

        if (!event.body) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Request body is required' }),
          }
        }

        const { content: localContent, filename } = JSON.parse(event.body)
        if (!filename || !localContent) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              error: 'Filename and content are required',
            }),
          }
        }

        result = await localOperations.saveSermon(filename, localContent)
        break

      case 'save':
        if (event.httpMethod !== 'POST') {
          return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method not allowed' }),
          }
        }

        if (!event.body) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Request body is required' }),
          }
        }

        const { content, contentType } = JSON.parse(event.body)
        if (!key || !content) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Key and content are required' }),
          }
        }

        result = await storageOperations.saveContent(
          key,
          content,
          contentType,
          storeName
        )
        break

      case 'get':
        if (!key) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Key is required' }),
          }
        }
        result = await storageOperations.getContent(key, storeName)

        // Handle audio file streaming with proper headers
        if (result.success && result.data?.audioBase64) {
          const audioHeaders: Record<string, string> = {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': `inline; filename="${key}"`,
            'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
          }

          return {
            statusCode: 200,
            headers: audioHeaders,
            body: result.data.audioBase64,
            isBase64Encoded: true,
          }
        }
        break

      case 'list':
        result = await storageOperations.listContent(storeName)
        break

      case 'delete':
        if (event.httpMethod !== 'DELETE') {
          return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method not allowed' }),
          }
        }
        if (!key) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Key is required' }),
          }
        }
        result = await storageOperations.deleteContent(key, storeName)
        break

      default:
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid operation' }),
        }
    }

    return {
      statusCode: result.success ? 200 : 500,
      headers: corsHeaders,
      body: JSON.stringify(result),
    }
  } catch (error) {
    console.error('Storage operation error:', error)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
    }
  }
}
