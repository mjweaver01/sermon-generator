# Vite Plugins

This directory contains custom Vite plugins for the Sermon Generator application.

## Plugins

### `vite-plugin-markdown-files.ts`
**Purpose**: Handles markdown file discovery and serving
- **Development**: Provides `/api/markdown-files` endpoint that dynamically reads markdown files from `public/markdown/`
- **Build**: Generates a static file list during build process
- **Functionality**: Lists all `.md` files in the markdown directory, sorted alphabetically

### `vite-plugin-sermon-generator.ts`
**Purpose**: Handles secure OpenAI API interactions for sermon generation
- **Development**: Provides `/api/generate-sermon` endpoint that accepts POST requests
- **Security**: Keeps OpenAI API key on the server-side only
- **Functionality**: 
  - Accepts sermon generation requests with question and biblical context
  - Streams responses using Server-Sent Events
  - Handles errors gracefully and provides proper status codes

## Usage

Both plugins are automatically loaded in `vite.config.ts`:

```typescript
import { markdownFilesPlugin } from './plugins/vite-plugin-markdown-files'
import { sermonGeneratorPlugin } from './plugins/vite-plugin-sermon-generator'

export default defineConfig({
  plugins: [vue(), markdownFilesPlugin(), sermonGeneratorPlugin()],
})
```

## Environment Variables

The sermon generator plugin requires an OpenAI API key:
- `VITE_OPENAI_API_KEY` or `OPENAI_API_KEY` 