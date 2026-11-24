#!/usr/bin/env bash
# Downloads every original asset in docs/assets-manifest.json into public/ (same paths as the reference site).
# Usage: bash scripts/download-assets.sh   (needs curl + jq; ~2-3 parallel jobs to be polite)
set -euo pipefail
cd "$(dirname "$0")/.."
jq -r '.[] | "\(.url) \(.path)"' docs/assets-manifest.json | while read -r url path; do
  out="public$path"; [ -s "$out" ] && continue
  mkdir -p "$(dirname "$out")"; echo "↓ $path"
  curl -sfL --retry 2 -A "Mozilla/5.0" "$url" -o "$out" || echo "  ✗ failed $path"
done
# fonts + icons
mkdir -p public/brand
for p in icon.png apple-icon.png; do curl -sfL "https://puppy.instabizweb.com/$p" -o "public/$p" || true; done
echo done
