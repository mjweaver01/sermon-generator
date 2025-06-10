<template>
  <div class="markdown-viewer">
    <div class="header">
      <button @click="goBack" class="back-btn">← Back to List</button>
      <h1>{{ filename }}</h1>
    </div>
    
    <div class="content">
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="error" class="error">
        <p>Error loading markdown file: {{ error }}</p>
      </div>
      <div v-else class="markdown-content" v-html="renderedMarkdown"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'

interface Props {
  filename: string
}

const props = defineProps<Props>()
const router = useRouter()

const markdownContent = ref('')
const loading = ref(true)
const error = ref('')

const renderedMarkdown = computed(() => {
  if (markdownContent.value) {
    return marked(markdownContent.value)
  }
  return ''
})

const goBack = () => {
  router.push('/')
}

const loadMarkdown = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const response = await fetch(`/markdown/${props.filename}`)
    if (!response.ok) {
      throw new Error(`Failed to load ${props.filename}`)
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
.markdown-viewer {
  max-width: 900px;
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

.content {
  min-height: 400px;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 1.1rem;
}

.error {
  text-align: center;
  padding: 2rem;
  color: #d63384;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.markdown-content {
  line-height: 1.6;
  color: #333;
}

/* Global styles for rendered markdown */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  color: #2c3e50;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.markdown-content :deep(h1) {
  border-bottom: 2px solid #eee;
  padding-bottom: 0.5rem;
}

.markdown-content :deep(p) {
  margin-bottom: 1rem;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #42b883;
  margin: 1rem 0;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  font-style: italic;
}

.markdown-content :deep(code) {
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.markdown-content :deep(pre) {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1rem 0;
}
</style> 