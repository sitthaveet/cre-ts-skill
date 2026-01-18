#!/bin/bash
# Fetch full CRE documentation from official source
# Output: JSON with success status and file path

set -e

DOCS_URL="https://docs.chain.link/cre/llms-full-ts.txt"
OUTPUT_FILE="/tmp/cre-docs-full.txt"

fetch_docs() {
    if curl -sSL "$DOCS_URL" -o "$OUTPUT_FILE" 2>/dev/null; then
        FILE_SIZE=$(wc -c < "$OUTPUT_FILE" | tr -d ' ')
        echo "{\"success\": true, \"file\": \"$OUTPUT_FILE\", \"size_bytes\": $FILE_SIZE, \"source\": \"$DOCS_URL\"}"
    else
        echo "{\"success\": false, \"error\": \"Failed to fetch docs from $DOCS_URL\", \"file\": null}"
        exit 1
    fi
}

fetch_docs
