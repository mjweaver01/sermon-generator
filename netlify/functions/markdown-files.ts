import { promises as fs } from 'fs';
import { join } from 'path';

export const handler = async (event: any, context: any) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
      },
      body: ""
    };
  }

  // Only handle GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    // Path to the markdown directory
    const markdownDir = join(process.cwd(), 'public', 'markdown');
    
    let files: string[] = [];
    
    try {
      // Read the markdown directory using Node.js fs
      const dirContents = await fs.readdir(markdownDir);
      files = dirContents
        .filter(file => file.endsWith('.md'))
        .sort();
    } catch (error) {
      console.log('Could not read markdown directory:', error);
      // Return empty array if directory doesn't exist or can't be read
      files = [];
    }
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300"
      },
      body: JSON.stringify(files)
    };

  } catch (error) {
    console.error('Error reading markdown files:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Failed to read markdown files" })
    };
  }
}; 