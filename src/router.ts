import { createRouter, createWebHistory } from 'vue-router'
import Home from './components/Home.vue'
import MarkdownViewer from './components/MarkdownViewer.vue'
import SermonGenerator from './components/SermonGenerator.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/generate',
    name: 'SermonGenerator',
    component: SermonGenerator
  },
  {
    path: '/markdown/:filename',
    name: 'MarkdownViewer',
    component: MarkdownViewer,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 