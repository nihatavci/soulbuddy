#!/bin/bash
# Local iOS build + App Store upload — skips EAS entirely.
# Uses Xcode's "automatically manage signing" so it talks directly to Apple
# and picks up the correct "Apple Distribution" cert from your keychain.
#
# Preflight:
#   - Xcode signed into Apple ID with access to team DN6Q7MMM66 (INFLOW Network LLC)
#   - pod install already ran in ios/ (or run: cd ios && pod install && cd ..)
#   - buildNumber in app.json not already used on App Store Connect
#
# Usage: bash scripts/build-and-upload-ios.sh

set -euo pipefail

# Skip Sentry source-map upload during local archive — mirrors eas.json's
# SENTRY_ALLOW_FAILURE flag so the build phase doesn't fail when no
# SENTRY_AUTH_TOKEN is set locally.
export SENTRY_DISABLE_AUTO_UPLOAD=true
export SENTRY_ALLOW_FAILURE=true

ROOT="/Users/nihat/fliq"
TEAM_ID="DN6Q7MMM66"
WORKSPACE="$ROOT/ios/Fliq.xcworkspace"
SCHEME="Fliq"
ARCHIVE="/tmp/Fliq.xcarchive"
EXPORT_DIR="/tmp/Fliq-export"
OPTS_PLIST="/tmp/Fliq-ExportOptions.plist"

cd "$ROOT"

echo "━━━━ 1/5 Regenerating ios/ from app.json (keeps both Info.plists in sync) ━━━━"
rm -rf ios
npx expo prebuild --platform ios --clean --no-install
( cd ios && pod install )

echo "━━━━ 2/5 Cleaning previous archive ━━━━"
rm -rf "$ARCHIVE" "$EXPORT_DIR"

echo "━━━━ 3/5 Writing ExportOptions.plist ━━━━"
cat > "$OPTS_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store</string>
  <key>teamID</key><string>$TEAM_ID</string>
  <key>signingStyle</key><string>automatic</string>
  <key>uploadSymbols</key><true/>
  <key>stripSwiftSymbols</key><true/>
</dict>
</plist>
EOF

echo "━━━━ 4/5 Archiving (5-10 min) ━━━━"
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE" \
  -allowProvisioningUpdates \
  CODE_SIGN_STYLE=Automatic \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  archive | xcbeautify 2>/dev/null || \
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE" \
  -allowProvisioningUpdates \
  CODE_SIGN_STYLE=Automatic \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  archive

echo "━━━━ 5/5 Exporting IPA ━━━━"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$OPTS_PLIST" \
  -allowProvisioningUpdates

IPA="$EXPORT_DIR/Fliq.ipa"
if [ ! -f "$IPA" ]; then
  echo "✗ IPA not found at $IPA"
  ls -la "$EXPORT_DIR"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ IPA ready: $IPA"
echo "  Size: $(du -h "$IPA" | cut -f1)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Upload via one of:"
echo "  (a) Transporter.app — drag $IPA into the app"
echo "  (b) asc CLI         — ~/.blitz/bin/asc builds upload --path \"$IPA\""
echo "  (c) xcrun altool    — xcrun altool --upload-app -t ios -f \"$IPA\" --apiKey <KEY> --apiIssuer <ISS>"
echo ""
echo "Opening Finder at export dir..."
open "$EXPORT_DIR"
