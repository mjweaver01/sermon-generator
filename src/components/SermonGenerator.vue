<template>
  <div class="sermon-generator-wrapper">
    <div class="sermon-generator">
      <div class="header">
        <div class="header-background"></div>
        <div class="header-nav">
          <button @click="goBack" class="back-btn">
            <span class="btn-icon">←</span>
            Back to List
          </button>
          <div class="header-title">
            <h1>🎯 Sermon Generator</h1>
          </div>
          <div class="header-spacer"></div>
        </div>
      </div>

      <div class="content" :class="{ 'sermon-view': generatedSermon }">
        <div class="generator-form">
          <div class="input-section">
            <label for="question">Your Question or Topic:</label>
            <textarea
              id="question"
              v-model="question"
              placeholder="Enter your question, concern, or topic for the sermon"
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

          <div class="prefill-section">
            <button
              @click="clearForm"
              class="clear-btn"
              :disabled="
                loading || (!question.trim() && !biblicalContext.trim())
              "
            >
              <span class="btn-icon">🗑️</span>
              Clear Form
            </button>
            <button
              @click="prefillExample"
              class="prefill-btn"
              :disabled="loading"
            >
              <span class="btn-icon">💡</span>
              Prefill Example
            </button>
          </div>

          <button
            @click="generateSermon"
            :disabled="!question.trim() || loading"
            class="generate-btn"
          >
            <span v-if="loading" class="loading-spinner-btn"></span>
            <span class="btn-icon">{{ loading ? '⏳' : '✨' }}</span>
            {{ loading ? 'Generating Sermon...' : 'Generate Sermon' }}
          </button>
        </div>

        <div v-if="error" class="error-message">
          <div class="error-icon">⚠️</div>
          <h3>Generation Error</h3>
          <p>{{ error }}</p>
        </div>

        <div v-if="generatedSermon" class="result-section">
          <div class="result-header">
            <h2>📖 Generated Sermon</h2>
            <div class="result-actions">
              <div class="filename-group">
                <input
                  v-model="filename"
                  placeholder="sermon-title"
                  class="filename-input"
                  :disabled="saving"
                />
                <span class="file-extension">.md</span>
              </div>
              <button
                @click="saveToFile"
                :disabled="!filename.trim() || saving"
                class="save-btn"
              >
                <span v-if="saving" class="loading-spinner-btn"></span>
                <span class="btn-icon">{{ saving ? '⏳' : '💾' }}</span>
                {{ saving ? 'Saving...' : 'Save as Markdown' }}
              </button>
            </div>

            <!-- Audio Generation Section -->
            <AudioPlayer
              :markdownText="generatedSermon"
              :filename="filename"
              :streamingInProgress="loading"
              @audioGenerated="onAudioGenerated"
            />
          </div>

          <div class="sermon-preview">
            <div v-html="renderedSermon" class="markdown-content"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import AudioPlayer from './AudioPlayer.vue'

// Function to process audio shortcodes
const processAudioShortcodes = (content: string): string => {
  // Replace [audio:data_url] with HTML audio player
  return content.replace(/\[audio:([^\]]+)\]/g, (match, audioUrl) => {
    return `<div class="audio-shortcode">
      <div class="audio-shortcode-header">
        <span class="audio-icon">🎵</span>
        <span class="audio-title">Audio Version</span>
      </div>
      <audio controls class="audio-shortcode-player">
        <source src="${audioUrl}" type="audio/mpeg">
        Your browser does not support the audio element.
      </audio>
    </div>`
  })
}

const router = useRouter()

const question = ref('')
const biblicalContext = ref('')
const generatedSermon = ref('')
const renderedSermon = ref('')
const filename = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const goBack = () => {
  router.push('/')
}

const clearForm = () => {
  question.value = ''
  biblicalContext.value = ''
  generatedSermon.value = ''
  renderedSermon.value = ''
  filename.value = ''
  error.value = ''
}

const prefillExample = () => {
  question.value = `
  I am struggling with the weight of the world, can you help provide me guidance?
  `.trim()
  biblicalContext.value = `
  “Gam zu le tova" = “this too is for the best”
  https://en.wikipedia.org/wiki/Nachum_Ish_Gamzu
  “The LORD is near to the brokenhearted and saves the crushed in spirit.”
  —Psalm 34:18 (ESV)
  “Cast all your anxieties on him, because he cares for you.”
  —1 Peter 5:7 (ESV)
  “I am the resurrection and the life. Whoever believes in me, though he die, yet shall he live, and everyone who lives and believes in me shall never die.”
  —John 11:25-26 (ESV)
  “For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come, nor powers, nor height nor depth, nor anything else in all creation, will be able to separate us from the love of God in Christ Jesus our Lord.”
  —Romans 8:38-39 (ESV)
  “For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast.”— Ephesians 2:8-9 (ESV)
  “Truly, truly, I say to you, whoever hears my word and believes him who sent me has eternal life. He does not come into judgment, but has passed from death to life.”— John 5:24 (ESV)
  “And we know that for those who love God all things work together for good, for those who are called according to his purpose.”
  —Romans 8:28 (ESV)
  “He will wipe away every tear from their eyes, and death shall be no more, neither shall there be mourning, nor crying, nor pain anymore, for the former things have passed away.”
  —Revelation 21:4 (ESV)
  `.trim()
}

const generateSermon = async () => {
  if (!question.value.trim()) return

  loading.value = true
  error.value = ''
  generatedSermon.value = ''
  renderedSermon.value = ''

  try {
    const response = await fetch('/api/generate-sermon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question.value.trim(),
        biblicalContext: biblicalContext.value.trim(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to generate sermon')
    }

    // Handle Server-Sent Events streaming
    if (!response.body) {
      throw new Error('No response body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let accumulatedContent = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))

            if (data.done) {
              // Stream is complete
              break
            }

            if (data.content) {
              accumulatedContent += data.content
              generatedSermon.value = accumulatedContent
              renderedSermon.value = await marked(accumulatedContent)
            }
          } catch (e) {
            // Skip invalid JSON lines
            continue
          }
        }
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
    // Use the exact filename, ensuring it ends with .md
    a.download = filename.value.endsWith('.md')
      ? filename.value
      : `${filename.value}.md`
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

const onAudioGenerated = async (audioUrl: string) => {
  // Add audio shortcode to the top of the generated sermon
  const shortcode = `[audio:${audioUrl}]\n\n`

  // Check if shortcode already exists to avoid duplicates (check for any audio shortcode)
  if (!generatedSermon.value.includes('[audio:')) {
    generatedSermon.value = shortcode + generatedSermon.value
    // Re-render the markdown with the new shortcode and process audio shortcodes
    const processedContent = processAudioShortcodes(generatedSermon.value)
    renderedSermon.value = await marked(processedContent)
  }
}
</script>

<style scoped>
.sermon-generator-wrapper {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
  width: 100%;
}

.sermon-generator {
  max-width: 1000px;
  margin: 0 auto;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

.header {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 2rem 3rem;
  margin-bottom: 0;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  overflow: hidden;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
    repeat;
  opacity: 0.3;
}

.header-nav {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.header-title {
  flex: 1;
  text-align: center;
}

.header-title h1 {
  margin: 0;
  color: white;
  font-size: 1.8rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-spacer {
  width: 140px; /* Match the back button width for centering */
}

.back-btn {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.btn-icon {
  font-size: 1.1rem;
}

.content {
  padding: 3rem 2rem;
  max-width: 800px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .content.sermon-view {
    display: grid;
    max-width: 100%;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
}

.generator-form {
  background: white;
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
}

@media (min-width: 768px) {
  .content.sermon-view .generator-form {
    margin-bottom: 0;
  }
}

.input-section {
  margin-bottom: 2rem;
}

.input-section label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #1f2937;
  font-size: 1.1rem;
}

.input-section textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  resize: vertical;
  transition: all 0.3s ease;
  background: #f8fafc;
  line-height: 1.6;
}

.input-section textarea:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-section textarea:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
  opacity: 0.7;
}

.prefill-section {
  margin-bottom: 2rem;
  text-align: right;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  flex-wrap: wrap;
}

.clear-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  flex-grow: 1;
  text-align: center;
}

.clear-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
}

.clear-btn:disabled {
  background: linear-gradient(135deg, #94a3b8, #64748b);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 12px rgba(148, 163, 184, 0.2);
  opacity: 0.5;
}

.prefill-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  flex-grow: 1;
  text-align: center;
}

.prefill-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.prefill-btn:disabled {
  background: linear-gradient(135deg, #94a3b8, #64748b);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 12px rgba(148, 163, 184, 0.2);
}

.generate-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1.25rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.generate-btn:disabled {
  background: linear-gradient(135deg, #94a3b8, #64748b);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 12px rgba(148, 163, 184, 0.2);
}

.loading-spinner-btn {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 1px solid #fca5a5;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-message h3 {
  color: #dc2626;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  font-size: 1.2rem;
}

.error-message p {
  color: #dc2626;
  margin: 0;
  font-weight: 500;
}

.result-section {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid #e5e7eb;
  animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-header {
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e5e7eb;
}

.result-header h2 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filename-group {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 200px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.3s ease;
}

.filename-group:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filename-input {
  flex: 1;
  padding: 0.75rem;
  border: none;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.9rem;
  background: transparent;
}

.filename-input:focus {
  outline: none;
}

.filename-input:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
  opacity: 0.7;
}

.file-extension {
  padding: 0.75rem;
  color: #64748b;
  font-weight: 600;
  background: #f8fafc;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.9rem;
}

.save-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.save-btn:disabled {
  background: linear-gradient(135deg, #94a3b8, #64748b);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 12px rgba(148, 163, 184, 0.2);
}

.sermon-preview {
  max-height: 600px;
  overflow-y: auto;
  padding: 3rem;
}

.markdown-content {
  line-height: 1.8;
  color: #374151;
  font-family: 'Crimson Text', Georgia, serif;
  font-size: 1.1rem;
}

/* Enhanced styles for rendered markdown - matching MarkdownViewer */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  color: #1f2937;
  margin-top: 2.5rem;
  margin-bottom: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
}

.markdown-content :deep(h1) {
  font-size: 2.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.markdown-content :deep(h2) {
  font-size: 1.875rem;
  color: #374151;
  position: relative;
  padding-left: 1rem;
}

.markdown-content :deep(h2)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.3rem;
  width: 4px;
  height: 70%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 2px;
}

.markdown-content :deep(h3) {
  font-size: 1.5rem;
  color: #4b5563;
}

.markdown-content :deep(p) {
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  text-align: justify;
  hyphens: auto;
}

.markdown-content :deep(blockquote) {
  border-left: 6px solid #667eea;
  margin: 2rem 0;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-style: italic;
  font-size: 1.15rem;
  border-radius: 0 12px 12px 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
  position: relative;
}

.markdown-content :deep(blockquote)::before {
  content: '"';
  position: absolute;
  top: -10px;
  left: 15px;
  font-size: 4rem;
  color: #667eea;
  opacity: 0.3;
  font-family: Georgia, serif;
}

.markdown-content :deep(strong) {
  font-weight: 700;
  color: #1f2937;
}

.markdown-content :deep(code) {
  background: #f8fafc;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.9rem;
  color: #e11d48;
  border: 1px solid #e2e8f0;
}

/* Audio Shortcode Styles */
.markdown-content :deep(.audio-shortcode) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 2rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.markdown-content :deep(.audio-shortcode-header) {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.markdown-content :deep(.audio-icon) {
  font-size: 1.25rem;
}

.markdown-content :deep(.audio-title) {
  font-weight: 600;
  color: #374151;
  font-size: 1.1rem;
}

.markdown-content :deep(.audio-shortcode-player) {
  width: 100%;
  border-radius: 8px;
  outline: none;
}

@media (max-width: 768px) {
  .sermon-generator {
    padding: 0;
  }

  .header {
    padding: 1.5rem 1rem;
  }

  .header-nav {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-title {
    order: -1;
  }

  .header-title h1 {
    font-size: 1.5rem;
  }

  .header-spacer {
    display: none;
  }

  .content {
    padding: 2rem 1rem;
  }

  .generator-form {
    padding: 2rem 1.5rem;
    border-radius: 16px;
  }

  .result-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .filename-group {
    min-width: auto;
  }

  .prefill-section {
    justify-content: space-between;
  }

  .back-btn {
    font-size: 0.85rem;
    padding: 0.6rem 1rem;
  }
}

@media (max-width: 480px) {
  .generator-form {
    padding: 1.5rem 1rem;
  }

  .sermon-preview {
    padding: 2rem 1rem;
  }

  .markdown-content :deep(.audio-shortcode) {
    padding: 1rem;
    margin: 1.5rem 0;
  }

  .markdown-content :deep(.audio-shortcode-header) {
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
  }

  .markdown-content :deep(.audio-title) {
    font-size: 1rem;
  }

  .markdown-content :deep(.audio-shortcode-player) {
    margin-top: 0.5rem;
  }
}
</style>
