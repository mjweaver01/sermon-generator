import { getStore } from '@netlify/blobs'

// Types for our storage system
interface StorageItem {
  key: string
  content: string
  contentType: string
  lastModified: Date
  source: 'local' | 'netlify'
}

interface StorageResponse {
  success: boolean
  data?: any
  error?: string
}

interface OperationResult {
  source: string
  success: boolean
}

// Environment detection
const isProduction = () => {
  return (globalThis as any).Deno?.env?.get('NETLIFY') === 'true'
}

// Get Netlify Blobs store
const getNetlifyStore = (storeName: string) => {
  return getStore(storeName)
}

// Helper function to read local files
const readLocalFile = async (path: string): Promise<string | null> => {
  try {
    const content = await (globalThis as any).Deno.readTextFile(path)
    return content
  } catch (error) {
    console.error('Error reading local file:', error)
    return null
  }
}

// Helper function to write local files
const writeLocalFile = async (
  path: string,
  content: string
): Promise<boolean> => {
  try {
    await (globalThis as any).Deno.writeTextFile(path, content)
    return true
  } catch (error) {
    console.error('Error writing local file:', error)
    return false
  }
}

// Helper function to list local files
const listLocalFiles = async (
  directory: string,
  extension: string
): Promise<string[]> => {
  try {
    const files: string[] = []
    for await (const entry of (globalThis as any).Deno.readDir(directory)) {
      if (entry.isFile && entry.name.endsWith(extension)) {
        files.push(entry.name)
      }
    }
    return files
  } catch (error) {
    console.error('Error listing local files:', error)
    return []
  }
}

// Main storage operations
export const storageOperations = {
  // Save content to storage
  async saveContent(
    key: string,
    content: string,
    contentType: string,
    storeName: string
  ): Promise<StorageResponse> {
    const results: OperationResult[] = []

    // Always save locally for development and backup
    const localPath =
      storeName === 'sermons'
        ? `./public/markdown/${key}`
        : `./public/audio/${key}`
    const localSuccess = await writeLocalFile(localPath, content)
    results.push({ source: 'local', success: localSuccess })

    // Save to Netlify Blobs if in production
    if (isProduction()) {
      try {
        const store = getNetlifyStore(storeName)
        await store.set(key, content, { metadata: { contentType } })
        results.push({ source: 'netlify', success: true })
      } catch (error) {
        console.error('Error saving to Netlify Blobs:', error)
        results.push({ source: 'netlify', success: false })
      }
    }

    return {
      success: results.some(r => r.success),
      data: { results },
    }
  },

  // Get content from storage
  async getContent(key: string, storeName: string): Promise<StorageResponse> {
    // Try Netlify Blobs first if in production
    if (isProduction()) {
      try {
        const store = getNetlifyStore(storeName)
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
      } catch (error) {
        console.error('Error getting from Netlify Blobs:', error)
      }
    }

    // Fall back to local file
    const localPath =
      storeName === 'sermons'
        ? `./public/markdown/${key}`
        : `./public/audio/${key}`
    const content = await readLocalFile(localPath)

    if (content) {
      return {
        success: true,
        data: {
          content,
          key,
          source: 'local',
          lastModified: new Date(),
        },
      }
    }

    return {
      success: false,
      error: 'Content not found',
    }
  },

  // List all content from both sources
  async listContent(storeName: string): Promise<StorageResponse> {
    const items: StorageItem[] = []

    // Get from Netlify Blobs if in production
    if (isProduction()) {
      try {
        const store = getNetlifyStore(storeName)
        const { blobs } = await store.list()

        for (const blob of blobs) {
          items.push({
            key: blob.key,
            content: '', // Content not loaded in list
            contentType: blob.etag ? 'text/plain' : 'text/plain', // Use etag as fallback
            lastModified: new Date(), // Use current date since we don't have uploaded_at
            source: 'netlify',
          })
        }
      } catch (error) {
        console.error('Error listing from Netlify Blobs:', error)
      }
    }

    // Get from local files
    const directory =
      storeName === 'sermons' ? './public/markdown' : './public/audio'
    const extension = storeName === 'sermons' ? '.md' : '.mp3'
    const localFiles = await listLocalFiles(directory, extension)

    // Add local files that aren't already in the list from Netlify
    for (const file of localFiles) {
      if (!items.some(item => item.key === file)) {
        items.push({
          key: file,
          content: '',
          contentType: storeName === 'sermons' ? 'text/markdown' : 'audio/mpeg',
          lastModified: new Date(), // We'd need to get actual file stats for this
          source: 'local',
        })
      }
    }

    return {
      success: true,
      data: { items },
    }
  },

  // Delete content from storage
  async deleteContent(
    key: string,
    storeName: string
  ): Promise<StorageResponse> {
    const results: OperationResult[] = []

    // Delete from Netlify Blobs if in production
    if (isProduction()) {
      try {
        const store = getNetlifyStore(storeName)
        await store.delete(key)
        results.push({ source: 'netlify', success: true })
      } catch (error) {
        console.error('Error deleting from Netlify Blobs:', error)
        results.push({ source: 'netlify', success: false })
      }
    }

    // Delete local file
    const localPath =
      storeName === 'sermons'
        ? `./public/markdown/${key}`
        : `./public/audio/${key}`
    try {
      await (globalThis as any).Deno.remove(localPath)
      results.push({ source: 'local', success: true })
    } catch (error) {
      console.error('Error deleting local file:', error)
      results.push({ source: 'local', success: false })
    }

    return {
      success: results.some(r => r.success),
      data: { results },
    }
  },
}

// Main edge function handler
export default async (request: Request) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  const url = new URL(request.url)
  const operation = url.searchParams.get('operation')
  const storeName = url.searchParams.get('store') || 'sermons'
  const key = url.searchParams.get('key')

  try {
    let result: StorageResponse

    switch (operation) {
      case 'save':
        if (request.method !== 'POST') {
          return new Response('Method not allowed', { status: 405 })
        }
        const { content, contentType } = await request.json()
        if (!key || !content) {
          return new Response('Key and content are required', { status: 400 })
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
          return new Response('Key is required', { status: 400 })
        }
        result = await storageOperations.getContent(key, storeName)
        break

      case 'list':
        result = await storageOperations.listContent(storeName)
        break

      case 'delete':
        if (request.method !== 'DELETE') {
          return new Response('Method not allowed', { status: 405 })
        }
        if (!key) {
          return new Response('Key is required', { status: 400 })
        }
        result = await storageOperations.deleteContent(key, storeName)
        break

      default:
        return new Response('Invalid operation', { status: 400 })
    }

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Storage operation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}
