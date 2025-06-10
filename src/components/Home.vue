<template>
  <div class="home">
    <h1>Markdown Files</h1>
    <div class="file-list">
      <div
        v-for="file in markdownFiles"
        :key="file.name"
        class="file-item"
        @click="openMarkdown(file.name)"
      >
        <h3>{{ file.display }}</h3>
        <p>{{ file.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// Define the markdown files available
const markdownFiles = [
  {
    name: 'anthony.md',
    display: 'Anthony Sermon',
    description: 'Click to read the Anthony sermon'
  },
  {
    name: 'anthony2.md',
    display: 'Anthony Sermon 2',
    description: 'Click to read the second Anthony sermon'
  }
]

const openMarkdown = (filename: string) => {
  router.push(`/markdown/${filename}`)
}
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 2rem;
}

.file-list {
  display: grid;
  gap: 1rem;
}

.file-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.file-item:hover {
  border-color: #42b883;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.file-item h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.file-item p {
  margin: 0;
  color: #666;
}
</style> 