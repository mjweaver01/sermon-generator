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
        "Content-Type": "text/plain"
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

  // Get filename from query string
  const filename = event.queryStringParameters?.filename;
  
  // If no filename provided, return list of available files
  if (!filename) {
    try {
      const pathsToTry = [
        // For local development
        join(process.cwd(), 'public', 'markdown'),
        // For local netlify dev environment
        join(process.cwd(), 'netlify', 'functions', 'markdown-files'),
        // For Netlify serverless functions with included files
        join(__dirname, '..', 'markdown-files'),
        join(__dirname),
        // Alternative Netlify paths
        process.env.LAMBDA_TASK_ROOT ? join(process.env.LAMBDA_TASK_ROOT, 'markdown-files') : null,
        process.env.LAMBDA_TASK_ROOT ? join(process.env.LAMBDA_TASK_ROOT) : null,
      ].filter(Boolean) as string[];
      
      let files: string[] = [];
      
      for (const path of pathsToTry) {
        try {
          console.log(`Trying to read directory: ${path}`);
          const dirContents = await fs.readdir(path);
          files = dirContents
            .filter(file => file.endsWith('.md'))
            .sort();
          console.log(`Found ${files.length} markdown files in ${path}`);
          break; // Success, stop trying other paths
        } catch (error: any) {
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
  }

  // Ensure filename ends with .md
  const fullFilename = filename.endsWith('.md') ? filename : `${filename}.md`;

  try {
    // Try different path approaches for finding markdown files
    const pathsToTry = [
      // For local development
      join(process.cwd(), 'public', 'markdown', fullFilename),
      // For local netlify dev environment
      join(process.cwd(), 'netlify', 'functions', 'markdown-files', fullFilename),
      // For Netlify serverless functions with included files - try markdown-files directory
      join(__dirname, '..', 'markdown-files', fullFilename),
      join(__dirname, fullFilename),
      // Alternative Netlify paths
      process.env.LAMBDA_TASK_ROOT ? join(process.env.LAMBDA_TASK_ROOT, 'markdown-files', fullFilename) : null,
      process.env.LAMBDA_TASK_ROOT ? join(process.env.LAMBDA_TASK_ROOT, fullFilename) : null,
    ].filter(Boolean) as string[];
    
    console.log(`Looking for file: ${fullFilename}`);
    console.log('Current working directory:', process.cwd());
    console.log('__dirname:', __dirname);
    console.log('Trying paths:', pathsToTry);
    
    let content = '';
    let found = false;
    
    for (const path of pathsToTry) {
      try {
        console.log(`Trying to read file: ${path}`);
        content = await fs.readFile(path, 'utf-8');
        console.log(`Successfully read file from: ${path}`);
        found = true;
        break; // Success, stop trying other paths
      } catch (error: any) {
        console.log(`Path ${path} failed:`, error.message);
        continue; // Try next path
      }
    }
    
    if (!found) {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: `Markdown file '${fullFilename}' not found` })
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300"
      },
      body: content
    };

  } catch (error) {
    console.error('Error reading markdown file:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Failed to read markdown file" })
    };
  }
}; 