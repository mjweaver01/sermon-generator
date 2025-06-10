<template>
  <div class="home">
    <h1>Sermons</h1>
    
    <div class="actions">
      <div
        class="action-item generator-item"
        @click="goToGenerator"
      >
        <h3>✨ Generate New Sermon</h3>
        <p>Create a personalized sermon using AI - ask questions, get guidance, and save as markdown</p>
      </div>
    </div>
    
    <h2>Saved Sermons</h2>
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

const goToGenerator = () => {
  router.push('/generate')
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

h2 {
  color: #2c3e50;
  margin: 2rem 0 1rem 0;
}

.actions {
  margin-bottom: 3rem;
}

.action-item {
  border: 2px solid #42b883;
  border-radius: 12px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #42b883, #369870);
  color: white;
  text-align: center;
}

.action-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(66, 184, 131, 0.3);
}

.action-item h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.4rem;
}

.action-item p {
  margin: 0;
  opacity: 0.9;
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