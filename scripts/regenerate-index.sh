#!/bin/bash

# Script to regenerate the index.json file for markdown files
# This is used as the primary method for discovering files, with Netlify Blobs as fallback

echo "Regenerating markdown index..."

# Change to project root directory (parent of scripts)
cd "$(dirname "$0")/.."

# Generate the index.json file
ls public/markdown/ | grep -v index.json | grep '\.md$' | jq -R -s -c 'split("\n") | map(select(. != "")) | sort' > public/markdown/index.json

echo "Index regenerated successfully!"
echo "Files included:"
cat public/markdown/index.json | jq -r '.[]' | sed 's/^/  - /' 
echo ""
echo "Note: The application uses public files as primary storage with Netlify Blobs as fallback."