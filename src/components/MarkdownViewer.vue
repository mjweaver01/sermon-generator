<template>
  <div class="markdown-viewer-wrapper">
    <div class="markdown-viewer">
      <div class="header">
        <div class="header-background"></div>
        <div class="header-nav">
          <button @click="goBack" class="back-btn">
            <span class="btn-icon">←</span>
            Back to List
          </button>
          <div class="header-title">
            <h1>
              📖
              {{
                filename
                  .replace(/[-_]/g, ' ')
                  .replace(/\b\w/g, (l: string) => l.toUpperCase())
              }}
            </h1>
          </div>
          <div class="header-actions">
            <button @click="viewRaw" class="action-btn raw-btn">
              <span class="btn-icon">🥩</span>
              View Raw
            </button>
            <button @click="downloadFile" class="action-btn download-btn">
              <span class="btn-icon">📥</span>
              Download
            </button>
          </div>
        </div>
      </div>

      <div class="content">
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <p>Loading sermon...</p>
        </div>
        <div v-else-if="error" class="error">
          <div class="error-icon">⚠️</div>
          <h3>Unable to Load Sermon</h3>
          <p>{{ error }}</p>
        </div>
        <div v-else class="markdown-content" v-html="renderedMarkdown"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import { emojiExtension } from '../marked-emoji'

interface Props {
  filename: string
}

const props = defineProps<Props>()
const router = useRouter()

const markdownContent = ref('')
const loading = ref(true)
const error = ref('')

marked.use({ extensions: [emojiExtension] })

const renderedMarkdown = computed(() => {
  if (markdownContent.value) {
    return marked(markdownContent.value)
  }
  return ''
})

const goBack = () => {
  router.push('/')
}

const viewRaw = () => {
  window.open(`/api/markdown-content?filename=${props.filename}`, '_blank')
}

const downloadFile = () => {
  if (!markdownContent.value) return

  const blob = new Blob([markdownContent.value], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.filename}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const loadMarkdown = async () => {
  try {
    loading.value = true
    error.value = ''

    // Use the new API endpoint to fetch markdown content
    const response = await fetch(
      `/api/markdown-content?filename=${props.filename}`
    )
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to load ${props.filename}`)
    }

    markdownContent.value = await response.text()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMarkdown()
})
</script>

<style scoped>
.markdown-viewer-wrapper {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
  width: 100%;
}

.markdown-viewer {
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
  padding: 2rem;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.action-btn {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.raw-btn:hover {
  background: rgba(255, 193, 7, 0.2);
}

.download-btn:hover {
  background: rgba(40, 167, 69, 0.2);
}

.btn-icon {
  font-size: 1.1rem;
}

.content {
  padding: 3rem 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.loading {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading p {
  font-size: 1.2rem;
  margin: 0;
  font-weight: 500;
}

.error {
  text-align: center;
  padding: 3rem 2rem;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 1px solid #fca5a5;
  border-radius: 20px;
  margin: 2rem 0;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error h3 {
  color: #dc2626;
  margin: 0 0 1rem 0;
  font-weight: 600;
  font-size: 1.3rem;
}

.error p {
  color: #dc2626;
  margin: 0;
  font-weight: 500;
}

.markdown-content {
  background: white;
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  line-height: 1.8;
  color: #374151;
  font-family: 'Crimson Text', Georgia, serif;
  font-size: 1.1rem;
  border: 1px solid #e5e7eb;
}

/* Enhanced styles for rendered markdown */
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

.markdown-content :deep(h4) {
  font-size: 1.25rem;
  color: #6b7280;
}

.markdown-content :deep(p) {
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  text-align: justify;
  hyphens: auto;
}

.markdown-content :deep(p:first-of-type) {
  font-size: 1.2rem;
  font-weight: 500;
  color: #374151;
}

.markdown-content :deep(p:last-of-type) {
  margin-bottom: 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 1.5rem;
  padding-left: 2rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.5rem;
  line-height: 1.7;
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

.markdown-content :deep(code) {
  background: #f8fafc;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.9rem;
  color: #e11d48;
  border: 1px solid #e2e8f0;
}

.markdown-content :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 1.5rem;
  border-radius: 12px;
  overflow-x: auto;
  margin: 1.5rem 0;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid #334155;
}

.markdown-content :deep(pre code) {
  background: transparent;
  padding: 0;
  border: none;
  color: inherit;
}

.markdown-content :deep(strong) {
  font-weight: 700;
  color: #1f2937;
}

.markdown-content :deep(em) {
  font-style: italic;
  color: #4b5563;
}

.markdown-content :deep(a) {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.markdown-content :deep(a):hover {
  color: #5a67d8;
  border-bottom-color: #5a67d8;
}

.markdown-content :deep(hr) {
  border: none;
  height: 3px;
  background: linear-gradient(90deg, transparent, #667eea, transparent);
  margin: 3rem 0;
  border-radius: 2px;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 2rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.markdown-content :deep(th) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
}

.markdown-content :deep(tr):hover {
  background: #f8fafc;
}

@media (max-width: 768px) {
  .markdown-viewer {
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

  .header-actions {
    justify-content: center;
  }

  .content {
    padding: 2rem 1rem;
  }

  .markdown-content {
    padding: 2rem 1.5rem;
    border-radius: 16px;
  }

  .markdown-content :deep(h1) {
    font-size: 1.875rem;
  }

  .markdown-content :deep(h2) {
    font-size: 1.5rem;
  }

  .markdown-content :deep(blockquote) {
    padding: 1rem 1.5rem;
    margin: 1.5rem 0;
  }

  .header-actions button {
    width: 100%;
  }

  .action-btn,
  .back-btn {
    font-size: 0.85rem;
    padding: 0.6rem 1rem;
  }
}

@media (max-width: 480px) {
  .header-nav {
    gap: 0.75rem;
  }

  .header-actions {
    gap: 0.75rem;
  }

  .action-btn,
  .back-btn {
    width: 100%;
    justify-content: center;
  }

  .markdown-content {
    padding: 1.5rem 1rem;
  }
}
</style>
