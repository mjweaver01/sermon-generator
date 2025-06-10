import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { markdownFilesPlugin } from './plugins/vite-plugin-markdown-files'
import { sermonGeneratorPlugin } from './plugins/vite-plugin-sermon-generator'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), markdownFilesPlugin(), sermonGeneratorPlugin()],
})
