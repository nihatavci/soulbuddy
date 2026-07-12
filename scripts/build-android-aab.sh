#!/bin/bash
# Local Android build — produces a signed AAB for Play Console upload.
# Uses gradle's -Pandroid.injected.signing.* flags so build.gradle stays clean.
#
# First run — fetch the keystore from EAS (only needed once):
#
#   mkdir -p ~/.keystore
#   eas credentials -p android
#     → pick the production profile
#     → Keystore: Manage everything needed to build your project
#     → Download Credentials
#       • Keystore → save as ~/.keystore/fliq-release.keystore
#       • Keystore Password, Key Alias, Key Password → paste below
#
#   Then create ~/.keystore/fliq-release.env with:
#     RELEASE_STORE_FILE="$HOME/.keystore/fliq-release.keystore"
#     RELEASE_STORE_PASSWORD='...'
#     RELEASE_KEY_ALIAS='...'
#     RELEASE_KEY_PASSWORD='...'
#
# Subsequent runs: just `bash scripts/build-android-aab.sh`

set -euo pipefail

ROOT="/Users/nihat/coupleai"
ENV_FILE="$HOME/.keystore/fliq-release.env"

if [ ! -f "$ENV_FILE" ]; then
  cat <<EOF
✗ Keystore env file not found: $ENV_FILE

First-time setup — follow the instructions at the top of this script to:
  1. Download the keystore from EAS: eas credentials -p android
  2. Save it to ~/.keystore/fliq-release.keystore
  3. Create ~/.keystore/fliq-release.env with the 4 credential vars

Then re-run this script.
EOF
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

: "${RELEASE_STORE_FILE:?not set in $ENV_FILE}"
: "${RELEASE_STORE_PASSWORD:?not set in $ENV_FILE}"
: "${RELEASE_KEY_ALIAS:?not set in $ENV_FILE}"
: "${RELEASE_KEY_PASSWORD:?not set in $ENV_FILE}"

if [ ! -f "$RELEASE_STORE_FILE" ]; then
  echo "✗ Keystore file does not exist: $RELEASE_STORE_FILE"
  exit 1
fi

cd "$ROOT/android"

echo "━━━━ 1/3 Cleaning previous build ━━━━"
./gradlew clean

echo "━━━━ 2/3 Building signed AAB (5-8 min) ━━━━"
./gradlew bundleRelease \
  -Pandroid.injected.signing.store.file="$RELEASE_STORE_FILE" \
  -Pandroid.injected.signing.store.password="$RELEASE_STORE_PASSWORD" \
  -Pandroid.injected.signing.key.alias="$RELEASE_KEY_ALIAS" \
  -Pandroid.injected.signing.key.password="$RELEASE_KEY_PASSWORD"

AAB="$ROOT/android/app/build/outputs/bundle/release/app-release.aab"
if [ ! -f "$AAB" ]; then
  echo "✗ AAB not found at $AAB"
  find "$ROOT/android/app/build/outputs" -name "*.aab" 2>/dev/null || true
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ AAB ready: $AAB"
echo "  Size: $(du -h "$AAB" | cut -f1)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Upload to Google Play:"
echo "  1. https://play.google.com/console → Fliq → Production (or Internal testing)"
echo "  2. Create release → drag-and-drop the AAB into the upload area"
echo "  3. Fill release notes → Review release → Start rollout"
echo ""
echo "━━━━ 3/3 Opening Finder at AAB ━━━━"
open -R "$AAB"
