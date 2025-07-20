#!/bin/bash

# Helper script to add a downloaded sermon to the local collection
# Usage: ./add-local-sermon.sh filename.md

if [ $# -eq 0 ]; then
    echo "Usage: ./add-local-sermon.sh filename.md"
    echo "This script moves a downloaded sermon file to public/markdown/ and updates the index"
    exit 1
fi

FILENAME="$1"

# Change to project root directory (parent of scripts)
cd "$(dirname "$0")/.."

# Check if file exists in current directory
if [ ! -f "$FILENAME" ]; then
    echo "Error: File '$FILENAME' not found in current directory"
    exit 1
fi

# Ensure filename ends with .md
if [[ ! "$FILENAME" == *.md ]]; then
    echo "Error: File must have .md extension"
    exit 1
fi

# Create markdown directory if it doesn't exist
mkdir -p public/markdown

# Move file to public/markdown
mv "$FILENAME" "public/markdown/"

if [ $? -eq 0 ]; then
    echo "✅ Moved '$FILENAME' to public/markdown/"
    
    # Regenerate index
    ./scripts/regenerate-index.sh
    
    echo "✅ Sermon added to local collection successfully!"
    echo ""
    echo "The sermon is now available in your local sermon list."
else
    echo "❌ Error: Failed to move file"
    exit 1
fi 