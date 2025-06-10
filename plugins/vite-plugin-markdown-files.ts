import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

export function markdownFilesPlugin(): Plugin {
  return {
    name: 'markdown-files',
    configureServer(server) {
      // Add API endpoint for listing markdown files in development
      server.middlewares.use('/api/markdown-files', (req, res, next) => {
        if (req.method === 'GET') {
          try {
            const markdownDir = path.join(process.cwd(), 'public', 'markdown')
            
            if (!fs.existsSync(markdownDir)) {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify([]))
              return
            }

            const files = fs.readdirSync(markdownDir)
              .filter(file => file.endsWith('.md'))
              .sort()

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(files))
          } catch (error) {
            console.error('Error reading markdown files:', error)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Failed to read markdown files' }))
          }
        } else {
          next()
        }
      })
    },
    generateBundle() {
      // Generate the file list at build time for production
      try {
        const markdownDir = path.join(process.cwd(), 'public', 'markdown')
        
        if (!fs.existsSync(markdownDir)) {
          // Create empty files list if no markdown directory exists
          this.emitFile({
            type: 'asset',
            fileName: 'api/markdown-files.json',
            source: JSON.stringify([])
          })
          return
        }

        const files = fs.readdirSync(markdownDir)
          .filter(file => file.endsWith('.md'))
          .sort()

        console.log(`Found ${files.length} markdown files for production build:`, files)

        // Emit the files list as a static JSON file
        this.emitFile({
          type: 'asset',
          fileName: 'api/markdown-files.json',
          source: JSON.stringify(files)
        })
      } catch (error) {
        console.error('Error generating markdown files list:', error)
        // Don't fail the build, just emit an empty list
        this.emitFile({
          type: 'asset',
          fileName: 'api/markdown-files.json',
          source: JSON.stringify([])
        })
      }
    }
  }
} 