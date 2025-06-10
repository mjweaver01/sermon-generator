<template>
  <div class="sermon-generator">
    <div class="header">
      <button @click="goBack" class="back-btn">← Back to List</button>
      <h1>Sermon Generator</h1>
    </div>
    
    <div class="generator-form">
      <div class="input-section">
        <label for="question">Your Question or Topic:</label>
        <textarea
          id="question"
          v-model="question"
          placeholder="Enter your question, concern, or topic for the sermon (e.g., 'I'm struggling with loss and need comfort')"
          rows="4"
          :disabled="loading"
        ></textarea>
      </div>

      <div class="input-section">
        <label for="context">Additional Biblical Context (Optional):</label>
        <textarea
          id="context"
          v-model="biblicalContext"
          placeholder="Add any relevant Bible verses or themes you'd like included"
          rows="3"
          :disabled="loading"
        ></textarea>
      </div>

      <button  
        @click="generateSermon" 
        :disabled="!question.trim() || loading"
        class="generate-btn"
      >
        {{ loading ? 'Generating Sermon...' : 'Generate Sermon' }}
      </button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="generatedSermon" class="result-section">
      <div class="result-header">
        <h2>Generated Sermon</h2>
        <div class="result-actions">
          <input
            v-model="filename"
            placeholder="sermon-title"
            class="filename-input"
            :disabled="saving"
          />
          <span class="file-extension">.md</span>
          <button 
            @click="saveToFile" 
            :disabled="!filename.trim() || saving"
            class="save-btn"
          >
            {{ saving ? 'Saving...' : 'Save as Markdown' }}
          </button>
        </div>
      </div>
      
      <div class="sermon-preview">
        <div v-html="renderedSermon" class="markdown-content"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import OpenAI from 'openai'

const router = useRouter()

const question = ref('')
const biblicalContext = ref('')
const generatedSermon = ref('')
const renderedSermon = ref('')
const filename = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

const goBack = () => {
  router.push('/')
}

const generateSermon = async () => {
  if (!question.value.trim()) return
  
  loading.value = true
  error.value = ''
  generatedSermon.value = ''
  renderedSermon.value = ''
  
  try {
    const systemPrompt = `
      You are a passionate Protestant preacher. 
      Craft a sermon in markdown format that speaks to the heart of the faithful. 
      Use a dynamic, engaging preaching style with biblical references, and a powerful call to action. 
      Ensure the sermon is biblically grounded, emotionally compelling, and relevant to contemporary Christian life.
    `

    const userPrompt = `${question.value.trim()}${biblicalContext.value.trim() ? '\n\nAdditional Biblical Context:\n' + biblicalContext.value.trim() : ''}`

    const stream = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
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

    let accumulatedContent = ''
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        accumulatedContent += content
        generatedSermon.value = accumulatedContent
        renderedSermon.value = await marked(accumulatedContent)
      }
    }
    
    if (!accumulatedContent) {
      throw new Error('No response generated')
    }
    
    // Generate a default filename based on the question
    const defaultFilename = question.value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
    filename.value = defaultFilename || `sermon-${Date.now()}`
    
  } catch (err: any) {
    error.value = err.message || 'Failed to generate sermon'
    console.error('Error generating sermon:', err)
  } finally {
    loading.value = false
  }
}

const saveToFile = async () => {
  if (!generatedSermon.value || !filename.value.trim()) return
  
  saving.value = true
  
  try {
    // Create a blob with the markdown content
    const blob = new Blob([generatedSermon.value], { type: 'text/markdown' })
    
    // Create a download link
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename.value.replace(/\.md$/, '')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    // Show success message
    alert('Sermon saved successfully!')
    
  } catch (err: any) {
    error.value = 'Failed to save file'
    console.error('Error saving file:', err)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.sermon-generator {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.back-btn {
  background: #42b883;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
  margin-bottom: 1rem;
  display: block;
}

.back-btn:hover {
  background: #369870;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
  text-align: center;
}

.generator-form {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.input-section {
  margin-bottom: 1.5rem;
}

.input-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.input-section textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  transition: border-color 0.3s ease;
}

.input-section textarea:focus {
  outline: none;
  border-color: #42b883;
}

.input-section textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.generate-btn {
  background: linear-gradient(135deg, #42b883, #369870);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.3);
}

.generate-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #fcc;
  margin-bottom: 2rem;
}

.result-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.result-header {
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.result-header h2 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filename-input {
  flex: 1;
  min-width: 200px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
}

.file-extension {
  color: #666;
  font-weight: 600;
}

.save-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s ease;
}

.save-btn:hover:not(:disabled) {
  background: #0056b3;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.sermon-preview {
  max-height: 600px;
  overflow-y: auto;
  padding: 2rem;
}

.markdown-content {
  line-height: 1.6;
  color: #333;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3 {
  color: #2c3e50;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.markdown-content h1 {
  border-bottom: 2px solid #eee;
  padding-bottom: 0.5rem;
}

.markdown-content blockquote {
  border-left: 4px solid #42b883;
  margin: 1rem 0;
  padding-left: 1rem;
  color: #666;
  font-style: italic;
}

.markdown-content p {
  margin-bottom: 1rem;
}

.markdown-content strong {
  color: #2c3e50;
}

@media (max-width: 768px) {
  .sermon-generator {
    padding: 1rem;
  }
  
  .result-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filename-input {
    min-width: auto;
  }
}
</style> 