#!/bin/bash
set -e
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "/Users/nihat/coupleai"

pkill -f cloudflared 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true

# Clear stale log
> /tmp/cf.log

echo "Starting tunnel..."
# Capture both stdout and stderr (cloudflared version-dependent)
cloudflared tunnel --url http://localhost:8085 --no-autoupdate > /tmp/cf.log 2>&1 &

for i in $(seq 1 30); do
  sleep 1
  # Match tunnel URLs but exclude the API endpoint itself
  URL=$(grep -aoi 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/cf.log 2>/dev/null | grep -v 'api\.trycloudflare\.com' | head -1)
  [ -n "$URL" ] && break
  echo -n "."
done

echo ""
if [ -z "$URL" ]; then
  echo "ERROR: Cloudflare tunnel failed to start."
  echo "--- cloudflared log ---"
  cat /tmp/cf.log
  echo "---"
  echo "Try using LAN mode instead: npx expo start --port 8085"
  exit 1
fi

HOST=$(echo "${URL#https://}" | tr -d '[:space:]')
echo "Open Expo Go: exp://$HOST"

EXPO_NO_DEPENDENCY_VALIDATION=1 EXPO_PACKAGER_PROXY_URL="https://$HOST" npx expo start --port 8085
