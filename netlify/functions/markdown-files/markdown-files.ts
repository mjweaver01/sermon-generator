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
    // In Netlify serverless environment, use different path strategies
    let markdownDir: string;
    let files: string[] = [];
    
    // Try different path approaches
    const pathsToTry = [
      // For local development
      join(process.cwd(), 'public', 'markdown'),
      // For Netlify serverless functions with included files
      join(__dirname, 'markdown'),
      // Alternative Netlify paths
      process.env.LAMBDA_TASK_ROOT ? join(process.env.LAMBDA_TASK_ROOT, 'markdown-files', 'markdown') : null,
      process.env.LAMBDA_TASK_ROOT ? join(process.env.LAMBDA_TASK_ROOT, 'markdown') : null,
    ].filter(Boolean) as string[];
    
    for (const path of pathsToTry) {
      try {
        console.log(`Trying to read directory: ${path}`);
        const dirContents = await fs.readdir(path);
        files = dirContents
          .filter(file => file.endsWith('.md'))
          .sort();
        console.log(`Found ${files.length} markdown files in ${path}`);
        break; // Success, stop trying other paths
      } catch (error) {
        console.log(`Path ${path} failed:`, error.message);
        continue; // Try next path
      }
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