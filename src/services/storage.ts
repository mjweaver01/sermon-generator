// Frontend storage service with explicit local vs Netlify options

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

type StorageLocation = 'local' | 'netlify'

class StorageService {
  private baseUrl = '/api/storage'

  /**
   * Save content to Netlify Blobs
   */
  async saveToNetlify(
    key: string,
    content: string,
    contentType: string,
    storeName: 'sermons' | 'audio' = 'sermons'
  ): Promise<StorageResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}?operation=save&store=${storeName}&key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content, contentType }),
        }
      )

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get content from Netlify Blobs
   */
  async getFromNetlify(
    key: string,
    storeName: 'sermons' | 'audio' = 'sermons'
  ): Promise<StorageResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}?operation=get&store=${storeName}&key=${encodeURIComponent(key)}`
      )

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * List content from Netlify Blobs
   */
  async listFromNetlify(
    storeName: 'sermons' | 'audio' = 'sermons'
  ): Promise<StorageResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}?operation=list&store=${storeName}`
      )

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get content from local public files
   */
  async getFromLocal(
    key: string,
    storeName: 'sermons' | 'audio' = 'sermons'
  ): Promise<StorageResponse> {
    try {
      const basePath = storeName === 'sermons' ? '/markdown' : '/audio'
      const response = await fetch(`${basePath}/${key}`)

      if (!response.ok) {
        return {
          success: false,
          error: `File not found: ${key}`,
        }
      }

      const content = await response.text()
      return {
        success: true,
        data: {
          content,
          key,
          source: 'local' as const,
          lastModified: new Date(),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * List content from local public files (using index.json for sermons)
   */
  async listFromLocal(
    storeName: 'sermons' | 'audio' = 'sermons'
  ): Promise<StorageResponse> {
    try {
      if (storeName === 'sermons') {
        const response = await fetch('/markdown/index.json')
        if (!response.ok) {
          return {
            success: false,
            error: 'Failed to load markdown file index',
          }
        }

        const filenames = await response.json()
        const items = filenames.map((filename: string) => ({
          key: filename,
          content: '',
          contentType: 'text/markdown',
          lastModified: new Date(),
          source: 'local' as const,
        }))

        return {
          success: true,
          data: { items },
        }
      } else {
        // For audio files, we can't easily list them from the browser
        // This would need to be implemented server-side or with a similar index file
        return {
          success: false,
          error: 'Local audio file listing not implemented',
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Delete content from Netlify Blobs
   */
  async deleteFromNetlify(
    key: string,
    storeName: 'sermons' | 'audio' = 'sermons'
  ): Promise<StorageResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}?operation=delete&store=${storeName}&key=${encodeURIComponent(key)}`,
        {
          method: 'DELETE',
        }
      )

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Save content to local filesystem (public/markdown folder)
   */
  async saveToLocal(
    filename: string,
    content: string
  ): Promise<StorageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}?operation=save-local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename, content }),
      })

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Save a markdown sermon with explicit location choice
   */
  async saveSermon(
    filename: string,
    content: string,
    location: StorageLocation = 'local'
  ): Promise<StorageResponse> {
    const key = filename.endsWith('.md') ? filename : `${filename}.md`

    if (location === 'netlify') {
      return this.saveToNetlify(key, content, 'text/markdown', 'sermons')
    } else {
      // Save directly to local filesystem via server-side function
      return this.saveToLocal(key, content)
    }
  }

  /**
   * Get a markdown sermon with explicit location choice
   */
  async getSermon(
    filename: string,
    location: StorageLocation = 'local'
  ): Promise<StorageResponse> {
    const key = filename.endsWith('.md') ? filename : `${filename}.md`

    if (location === 'netlify') {
      return this.getFromNetlify(key, 'sermons')
    } else {
      return this.getFromLocal(key, 'sermons')
    }
  }

  /**
   * List all sermons with explicit location choice
   */
  async listSermons(
    location: StorageLocation = 'local'
  ): Promise<StorageResponse> {
    if (location === 'netlify') {
      return this.listFromNetlify('sermons')
    } else {
      return this.listFromLocal('sermons')
    }
  }

  /**
   * Save audio file with explicit location choice
   */
  async saveAudio(
    filename: string,
    audioBuffer: ArrayBuffer,
    location: StorageLocation = 'local'
  ): Promise<StorageResponse> {
    if (location === 'netlify') {
      // Convert ArrayBuffer to base64 for transmission to Netlify Blobs
      const uint8Array = new Uint8Array(audioBuffer)
      const binaryString = Array.from(uint8Array, byte =>
        String.fromCharCode(byte)
      ).join('')
      const base64Content = btoa(binaryString)

      return this.saveToNetlify(filename, base64Content, 'audio/mpeg', 'audio')
    } else {
      // For local saving, we can only provide download functionality
      return {
        success: true,
        data: {
          message: 'Local save requires manual download',
          downloadContent: audioBuffer,
          filename,
        },
      }
    }
  }

  /**
   * Get audio file with explicit location choice
   */
  async getAudio(
    filename: string,
    location: StorageLocation = 'local'
  ): Promise<StorageResponse> {
    if (location === 'netlify') {
      return this.getFromNetlify(filename, 'audio')
    } else {
      return this.getFromLocal(filename, 'audio')
    }
  }

  /**
   * List all audio files with explicit location choice
   */
  async listAudio(
    location: StorageLocation = 'local'
  ): Promise<StorageResponse> {
    if (location === 'netlify') {
      return this.listFromNetlify('audio')
    } else {
      return this.listFromLocal('audio')
    }
  }
}

// Export a singleton instance
export const storageService = new StorageService()
export type { StorageItem, StorageResponse, StorageLocation }
