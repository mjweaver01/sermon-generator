# Sermon Generator & Viewer

A Vue.js app for generating personalized sermons using AI and viewing markdown files.

## Features

- 🎯 **AI-Powered Sermon Generation**: Ask questions or share concerns to generate personalized sermons
- 📝 **Markdown Export**: Save generated sermons as markdown files
- 📖 **Beautiful Viewer**: Read sermons with a clean, formatted interface
- 🔍 **Biblical Integration**: Include specific verses and themes in your sermons

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure OpenAI API:**
   - Create a `.env` file in the project root
   - Add your OpenAI API key:
     ```
     VITE_OPENAI_API_KEY=your_actual_openai_api_key_here
     ```
   - The API key is now securely used on the server-side only

3. **Start development server:**
   ```bash
   npm run dev
   ```

## Usage

1. **Generate a Sermon:**
   - Visit the home page and click "Generate New Sermon"
   - Enter your question, concern, or topic
   - Optionally add biblical context or specific verses
   - Click "Generate Sermon" and wait for the AI response
   - Save the result as a markdown file

2. **View Saved Sermons:**
   - Place your markdown files in the `public/markdown/` directory
   - Files are automatically discovered and displayed on the home page
   - Click on any sermon from the home page to view it

## Technology Stack

- Vue 3 with TypeScript
- OpenAI GPT-4 API
- Marked (for markdown rendering)
- Vite (build tool)
