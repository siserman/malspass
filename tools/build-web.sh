#!/bin/sh
# Copies the web app into www/, which Capacitor bundles into the iOS app.
# The web app itself has no build step; this only picks the files that ship.
set -e
cd "$(dirname "$0")/.."
rm -rf www
mkdir -p www
cp index.html manifest.webmanifest sw.js icon-192.png icon-512.png apple-touch-icon.png www/
cp -R css js audio www/
echo "www/: $(find www -type f | wc -l | tr -d ' ') files"
