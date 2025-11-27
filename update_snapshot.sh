#!/bin/bash

set -euo pipefail

URL_FILE="${URL_FILE:-urls.txt}"

if [[ ! -f "$URL_FILE" ]]; then
  echo "URL file '$URL_FILE' not found." >&2
  exit 1
fi

while IFS= read -r url || [[ -n "$url" ]]; do
  # Trim leading/trailing whitespace
  trimmed_url="$(echo "$url" | xargs)"

  # Skip empty lines or comments
  if [[ -z "$trimmed_url" ]] || [[ "$trimmed_url" =~ ^# ]]; then
    continue
  fi

  echo "Processing URL: $trimmed_url"
  node snapshot_script.js "$trimmed_url"

  # Optional pause to avoid overwhelming remote server
  sleep 1
done < "$URL_FILE"

echo "All snapshots are complete."
