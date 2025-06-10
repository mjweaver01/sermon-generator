import type { Plugin } from 'vite'
import { loadEnv } from 'vite'

export function sermonGeneratorPlugin(): Plugin {
  return {
    name: 'sermon-generator',
    configureServer(server) {
      // Load environment variables
      const env = loadEnv('', process.cwd(), '')
      // Add API endpoint for OpenAI sermon generation
      server.middlewares.use('/api/generate-sermon', async (req, res, next) => {
        if (req.method === 'POST') {
          try {
            // Parse request body
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            
            req.on('end', async () => {
              try {
                const { question, biblicalContext } = JSON.parse(body)
                
                if (!question?.trim()) {
                  res.writeHead(400, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ error: 'Question is required' }))
                  return
                }

                // Check for OpenAI API key
                const apiKey = env.VITE_OPENAI_API_KEY || env.OPENAI_API_KEY
                if (!apiKey) {
                  res.writeHead(500, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ error: 'OpenAI API key not configured' }))
                  return
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

                // Set up Server-Sent Events for streaming
                res.writeHead(200, {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  'Connection': 'keep-alive',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Headers': 'Cache-Control'
                })

                const stream = await openai.chat.completions.create({
                  model: "gpt-4o-mini",
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
                  stream: true
                })

                for await (const chunk of stream) {
                  const content = chunk.choices[0]?.delta?.content || ''
                  if (content) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`)
                  }
                }
                
                res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
                res.end()

              } catch (parseError) {
                console.error('Error parsing request or generating sermon:', parseError)
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'Failed to generate sermon' }))
              }
            })
          } catch (error) {
            console.error('Error in sermon generation endpoint:', error)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Failed to generate sermon' }))
          }
        } else {
          next()
        }
      })
    }
  }
} 