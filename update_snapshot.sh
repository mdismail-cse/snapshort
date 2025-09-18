#!/bin/bash

# Read URLs from urls.txt and process them
for url in $(cat urls.txt); do
    if [ -n "$url" ]; then
        echo "Processing URL: $url"
        node snapshot_script.js "$url"
    fi
done

echo "All snapshots are complete."
