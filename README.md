# Sermon Generator & Viewer

A Vue.js app for generating personalized sermons using AI and viewing markdown files. Optimized for deployment on Netlify with Edge Functions for streaming AI responses.

## Features

- 🎯 **AI-Powered Sermon Generation**: Ask questions or share concerns to generate personalized sermons
- 📝 **Markdown Export**: Save generated sermons as markdown files
- 📖 **Beautiful Viewer**: Read sermons with a clean, formatted interface
- 🔍 **Biblical Integration**: Include specific verses and themes in your sermons
- ⚡ **Streaming Responses**: Real-time sermon generation with streaming support
- 🌐 **Netlify Edge Functions**: Server-side processing with enhanced performance

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure OpenAI API:**

   - For local development, create a `.env` file in the project root:
     ```
     OPENAI_API_KEY=your_actual_openai_api_key_here
     ```
   - For Netlify deployment, set the environment variable in your Netlify site settings

3. **Start development server:**

   ```bash
   npm run dev
   ```

   **Or use Netlify Dev for full edge functions support:**

   ```bash
   npm run netlify:dev
   ```

## File Structure

The app now uses a static file structure instead of Netlify functions for serving markdown and audio files:

```
public/
├── markdown/           # Markdown sermon files
│   ├── index.json     # Auto-generated index of available files
│   └── *.md          # Sermon markdown files
├── audio/             # Audio files (MP3)
│   └── *.mp3         # Audio files for sermons
└── logo.svg          # App logo
```

Generated files are automatically saved to the appropriate public directories and served directly by the web server.

## Usage

1. **Generate a Sermon:**

   - Visit the home page and click "Generate New Sermon"
   - Enter your question, concern, or topic
   - Optionally add biblical context or specific verses
   - Click "Generate Sermon" and wait for the AI response
   - Save the result as a markdown file

2. **View Saved Sermons:**

   - Place your markdown files in the `public/markdown/` directory
   - Audio files should be placed in the `public/audio/` directory
   - Run `./regenerate-index.sh` to update the file index after adding new files
   - Files are automatically discovered and displayed on the home page
   - Click on any sermon from the home page to view it

3. **Adding New Files:**
   - For markdown files: Add them to `public/markdown/` and run `./regenerate-index.sh`
   - For audio files: Add them to `public/audio/` and reference them in markdown using `[audio:/audio/filename.mp3]`
   - Generated audio files are automatically saved to `public/audio/`

## Netlify Deployment

This app is now optimized for Netlify deployment with Edge Functions for enhanced performance and streaming support.

### Deploy to Netlify

1. **Connect your repository** to Netlify
2. **Set environment variables** in Netlify site settings:
   - `OPENAI_API_KEY`: Your OpenAI API key
3. **Build settings** are automatically configured via `netlify.toml`
4. **Deploy** - Netlify will automatically build and deploy your site

### Local Development with Netlify

```bash
# Install Netlify CLI globally (if not already installed)
npm install -g netlify-cli

# Start local development with edge functions
npm run netlify:dev
```

### Edge Functions Features

- **Streaming Responses**: Real-time sermon generation with SSE (Server-Sent Events)
- **Enhanced Timeouts**: 5-minute timeout support for long-running AI requests
- **Secure API Keys**: Server-side environment variable handling
- **CORS Support**: Proper cross-origin resource sharing configuration

## Technology Stack

- Vue 3 with TypeScript
- OpenAI API
- Netlify Edge Functions (Deno runtime)
- Marked (for markdown rendering)
- Vite (build tool)
