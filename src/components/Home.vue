<template>
  <div class="home-wrapper">
    <div class="home">
      <div class="hero-section">
        <h1 class="main-title">
          <span class="title-icon">✝️</span>
          <div class="title-text">Sermons</div>
          <span class="title-decoration"></span>
        </h1>
        <p class="hero-subtitle">
          Discover wisdom, create inspiration, and share faith
        </p>
      </div>

      <div class="actions">
        <div class="action-item generator-item" @click="goToGenerator">
          <div class="action-icon">🎯</div>
          <h3>Generate New Sermon</h3>
          <p>
            Create a personalized sermon using AI - ask questions, get guidance,
            and save as markdown
          </p>
          <div class="action-arrow">→</div>
        </div>
      </div>

      <div class="sermons-section">
        <div class="section-header">
          <h2>📚 Saved Sermons</h2>
          <div class="section-divider"></div>
        </div>

        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <p>Loading sermons...</p>
        </div>
        <div v-else-if="error" class="error">
          <div class="error-icon">⚠️</div>
          <p>Error loading sermons: {{ error }}</p>
        </div>
        <div v-else-if="markdownFiles.length === 0" class="empty">
          <div class="empty-icon">📝</div>
          <h3>No sermons found</h3>
          <p>Start by generating your first sermon above!</p>
        </div>
        <div v-else class="file-list">
          <div
            v-for="(file, index) in markdownFiles"
            :key="file.name"
            class="file-item"
            @click="openMarkdown(file.name)"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="file-icon">📖</div>
            <div class="file-content">
              <h3>{{ file.display }}</h3>
              <p>{{ file.description }}</p>
            </div>
            <div class="file-arrow">→</div>
          </div>
        </div>

        <div class="storage-selector">
          <label for="storage-location">Storage Location:</label>
          <select
            id="storage-location"
            v-model="storageLocation"
            @change="onStorageLocationChange"
            class="storage-select"
          >
            <option value="local">Local Files (public/markdown/)</option>
            <option value="netlify">Netlify Blobs (cloud)</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storageService, type StorageLocation } from '../services/storage'

const router = useRouter()

interface MarkdownFile {
  name: string
  display: string
  description: string
}

// Reactive reference for markdown files
const markdownFiles = ref<MarkdownFile[]>([])
const loading = ref(true)
const error = ref('')
const storageLocation = ref<StorageLocation>('local')

// Function to generate display name from filename
const generateDisplayName = (filename: string): string => {
  // Remove .md extension and convert to title case
  const nameWithoutExtension = filename.replace('.md', '')

  // Handle special cases and convert to readable format
  return (
    nameWithoutExtension
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') + ' Sermon'
  )
}

// Load markdown files from selected storage location
const loadMarkdownFiles = async () => {
  try {
    loading.value = true
    error.value = ''

    // Use storage service with explicit location choice
    const result = await storageService.listSermons(storageLocation.value)

    if (!result.success) {
      throw new Error(
        result.error ||
          `Failed to load sermons from ${storageLocation.value} storage`
      )
    }

    const items = result.data?.items || []

    markdownFiles.value = items.map((item: any) => ({
      name: item.key,
      display: generateDisplayName(item.key),
      description: `Click to read the ${generateDisplayName(item.key).toLowerCase()}`,
    }))

    console.log(
      `Loaded ${items.length} sermons from ${storageLocation.value} storage`
    )
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error loading markdown files:', err)
  } finally {
    loading.value = false
  }
}

// Handle storage location change
const onStorageLocationChange = () => {
  loadMarkdownFiles()
}

const openMarkdown = (filename: string) => {
  // Remove .md extension from the filename for cleaner URLs
  const nameWithoutExtension = filename.replace('.md', '')
  router.push(`/markdown/${nameWithoutExtension}`)
}

const goToGenerator = () => {
  router.push('/generate')
}

// Load files when component mounts
onMounted(() => {
  loadMarkdownFiles()
})
</script>

<style scoped>
.home-wrapper {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
  width: 100%;
}

.home {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

.hero-section {
  text-align: center;
  margin-bottom: 4rem;
  padding: 3rem 0;
}

.main-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 2rem;
  position: relative;
  display: inline-block;
}

.title-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-icon {
  font-size: 2.5rem;
  animation: sparkle 2s ease-in-out infinite;
}

.title-decoration {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
}

@keyframes sparkle {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.1) rotate(5deg);
  }
}

.hero-subtitle {
  font-size: 1.2rem;
  color: #64748b;
  font-weight: 400;
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.6;
}

.actions {
  margin-bottom: 4rem;
}

.action-item {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 20px;
  padding: 2.5rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.action-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s;
}

.action-item:hover::before {
  left: 100%;
}

.action-item:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.4);
}

.action-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.action-item h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.action-item p {
  margin: 0;
  opacity: 0.9;
  font-size: 1rem;
  line-height: 1.5;
}

.action-arrow {
  position: absolute;
  bottom: 1.5rem;
  right: 2rem;
  font-size: 1.5rem;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.action-item:hover .action-arrow {
  opacity: 1;
  transform: translateX(0);
}

.sermons-section {
  margin-top: 3rem;
}

.section-header {
  margin-bottom: 2rem;
  text-align: center;
}

.section-header h2 {
  font-size: 2rem;
  font-weight: 600;
  color: #334155;
  margin: 0;
}

.storage-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 2rem 0;
  justify-content: center;
}

.storage-selector label {
  font-weight: 500;
  color: #64748b;
  font-size: 0.9rem;
}

.storage-select {
  padding: 0.5rem 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
}

.storage-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.storage-select:hover {
  border-color: #cbd5e1;
}

.section-divider {
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  margin: 1rem auto;
  border-radius: 2px;
}

.file-list {
  display: grid;
  gap: 1.5rem;
  margin-top: 2rem;
}

.file-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  animation: slideInUp 0.6s ease-out both;
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

.file-item:hover {
  border-color: #667eea;
  transform: translateY(-4px);
  box-shadow: 0 12px 25px rgba(102, 126, 234, 0.15);
}

.file-icon {
  font-size: 2.5rem;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.file-item:hover .file-icon {
  transform: scale(1.1);
  opacity: 1;
}

.file-content {
  flex: 1;
}

.file-content h3 {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  font-weight: 600;
  font-size: 1.2rem;
}

.file-content p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.4;
}

.file-arrow {
  font-size: 1.5rem;
  color: #667eea;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.file-item:hover .file-arrow {
  opacity: 1;
  transform: translateX(0);
}

.loading {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
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
  font-size: 1.1rem;
  margin: 0;
}

.error {
  text-align: center;
  padding: 2.5rem;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 1px solid #fca5a5;
  border-radius: 16px;
  margin: 1rem 0;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error p {
  color: #dc2626;
  margin: 0;
  font-weight: 500;
}

.empty {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty h3 {
  margin: 0 0 0.5rem 0;
  color: #334155;
  font-weight: 600;
}

.empty p {
  margin: 0;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .home {
    padding: 1rem;
  }

  .main-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .action-item {
    padding: 2rem;
  }

  .file-item {
    padding: 1.5rem;
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .file-arrow {
    position: static;
    transform: rotate(90deg);
  }

  .file-item:hover .file-arrow {
    transform: rotate(90deg);
  }
}
</style>
