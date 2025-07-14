#!/bin/bash

# Script to regenerate the index.json file for markdown files
# This should be run whenever new markdown files are added to public/markdown/

echo "Regenerating markdown index..."

# Generate the index.json file
ls public/markdown/ | grep -v index.json | grep '\.md$' | jq -R -s -c 'split("\n") | map(select(. != "")) | sort' > public/markdown/index.json

echo "Index regenerated successfully!"
echo "Files included:"
cat public/markdown/index.json | jq -r '.[]' | sed 's/^/  - /' 