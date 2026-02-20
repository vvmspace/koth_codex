#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_FILE="$ROOT_DIR/global-config.json"
SOURCE_URL="${1:-https://ton.org/global-config.json}"

if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$SOURCE_URL" -o "$OUT_FILE"
elif command -v wget >/dev/null 2>&1; then
  wget -qO "$OUT_FILE" "$SOURCE_URL"
else
  echo "Error: neither curl nor wget is installed" >&2
  exit 1
fi

if command -v jq >/dev/null 2>&1; then
  jq -e '.liteservers and (.liteservers | length > 0)' "$OUT_FILE" >/dev/null
else
  if ! grep -q '"liteservers"' "$OUT_FILE"; then
    echo "Downloaded file does not look like TON global config (missing liteservers)" >&2
    exit 1
  fi
fi

echo "Saved TON global config to: $OUT_FILE"
