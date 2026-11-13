#!/usr/bin/env bash
#
# Build and (optionally) upload a TestFlight build of Klecksinger.
#
#   tools/release.sh              build only
#   tools/release.sh --upload     build, then upload to App Store Connect
#   tools/release.sh --no-bump    reuse the current build number
#
# The same idea as the Flutter apps' tool/release.sh, for the Capacitor shell:
# copy the web app with test mode off, sync, archive, export, upload.
# Signing and upload use the account-wide App Store Connect API key:
# ASC_KEY_ID and ASC_ISSUER_ID in the environment, and the key itself at
# ~/.appstoreconnect/private_keys/AuthKey_<KEYID>.p8 (never in the repo).

set -euo pipefail
cd "$(dirname "$0")/.."

BUMP=1
UPLOAD=0
for arg in "$@"; do
  case "$arg" in
    --upload)  UPLOAD=1 ;;
    --no-bump) BUMP=0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

: "${ASC_KEY_ID:?set ASC_KEY_ID}"
: "${ASC_ISSUER_ID:?set ASC_ISSUER_ID}"
KEY="$HOME/.appstoreconnect/private_keys/AuthKey_${ASC_KEY_ID}.p8"
[ -f "$KEY" ] || { echo "missing private key at $KEY" >&2; exit 1; }
AUTH=(-allowProvisioningUpdates -authenticationKeyPath "$KEY"
      -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID")

PBX=ios/App/App.xcodeproj/project.pbxproj
NAME=$(grep -m1 -oE 'MARKETING_VERSION = [^;]+' "$PBX" | sed 's/.*= //')
BUILD=$(grep -m1 -oE 'CURRENT_PROJECT_VERSION = [0-9]+' "$PBX" | sed 's/.*= //')
if [ "$BUMP" = "1" ]; then
  # App Store Connect refuses a build number it has already seen.
  BUILD=$((BUILD + 1))
  sed -i '' -E "s/CURRENT_PROJECT_VERSION = [0-9]+;/CURRENT_PROJECT_VERSION = ${BUILD};/" "$PBX"
  echo "==> bumped to ${NAME} (${BUILD})"
else
  echo "==> reusing ${NAME} (${BUILD})"
fi

# Apple rejects an icon with an alpha channel, and only after the upload.
ICON=$(ls ios/App/App/Assets.xcassets/AppIcon.appiconset/*.png | head -1)
if sips -g hasAlpha "$ICON" 2>/dev/null | grep -q "hasAlpha: yes"; then
  echo "!!  $ICON has an alpha channel; Apple will reject the build." >&2
  exit 1
fi

echo "==> web app, test mode off"
sh tools/build-web.sh release
npx cap sync ios

# The store build must never carry test mode.
grep -q '^  Mal\.DEV = false;$' ios/App/App/public/js/core.js \
  || { echo "!!  test mode is still on in the bundled app" >&2; exit 1; }

ARCHIVE=build/release/Klecksinger.xcarchive
OUT=build/release/ipa
rm -rf "$ARCHIVE" "$OUT"

echo "==> archive"
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$ARCHIVE" \
  -clonedSourcePackagesDirPath build/sim/SourcePackages "${AUTH[@]}" archive | tail -3

cat > build/release/ExportOptions.plist <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>export</string>
  <key>teamID</key><string>XWY4S3RCZA</string>
  <key>signingStyle</key><string>automatic</string>
</dict></plist>
PLIST

echo "==> export"
xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportPath "$OUT" \
  -exportOptionsPlist build/release/ExportOptions.plist "${AUTH[@]}" | tail -3

IPA=$(ls -t "$OUT"/*.ipa 2>/dev/null | head -1)
[ -n "$IPA" ] || { echo "no .ipa produced" >&2; exit 1; }
echo "==> built $IPA"

# Put the working copy back the way own-device builds expect it.
sh tools/build-web.sh >/dev/null && npx cap sync ios >/dev/null

if [ "$UPLOAD" = "0" ]; then
  echo "==> not uploading (pass --upload)"
  exit 0
fi

echo "==> validating"
xcrun altool --validate-app --type ios --file "$IPA" --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"
echo "==> uploading"
xcrun altool --upload-app --type ios --file "$IPA" --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"
echo "==> uploaded ${NAME} (${BUILD}). Processing takes 5-15 minutes."
