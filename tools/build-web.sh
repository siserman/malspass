#!/bin/sh
# Copies the web app into www/, which Capacitor bundles into the iOS app.
# The web app itself has no build step; this only picks the files that ship.
#
#   tools/build-web.sh            as it is, test mode available (own devices)
#   tools/build-web.sh release    test mode off, for TestFlight and the store
set -e
cd "$(dirname "$0")/.."
rm -rf www
mkdir -p www
cp index.html manifest.webmanifest sw.js icon-192.png icon-512.png apple-touch-icon.png www/
cp -R css js audio www/
if [ "${1:-}" = "release" ]; then
  # The copy in www/ is changed, never the source: the web app keeps test mode.
  sed -i '' 's/^  Mal\.DEV = true;$/  Mal.DEV = false;/' www/js/core.js
  grep -q '^  Mal\.DEV = false;$' www/js/core.js || { echo "could not switch test mode off" >&2; exit 1; }
  echo "release: test mode off"
fi
echo "www/: $(find www -type f | wc -l | tr -d ' ') files"
