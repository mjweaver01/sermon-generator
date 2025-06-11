import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

export function markdownFilesPlugin(): Plugin {
  return {
    name: 'markdown-files',
    configureServer(server) {
      // Add API endpoint for listing markdown files
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
      // Generate the file list at build time
      try {
        const markdownDir = path.join(process.cwd(), 'public', 'markdown')
        
        if (!fs.existsSync(markdownDir)) {
          return
        }

        const files = fs.readdirSync(markdownDir)
          .filter(file => file.endsWith('.md'))
          .sort()

        // Emit the files list as a virtual asset that can be accessed at /api/markdown-files
        this.emitFile({
          type: 'asset',
          fileName: 'api/markdown-files.json',
          source: JSON.stringify(files)
        })
      } catch (error) {
        console.error('Error generating markdown files list:', error)
      }
    }
  }
} 