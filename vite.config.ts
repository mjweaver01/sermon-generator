import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { markdownFilesPlugin } from './plugins/vite-plugin-markdown-files'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), markdownFilesPlugin()],
})
