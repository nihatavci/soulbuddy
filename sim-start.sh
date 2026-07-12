#!/bin/bash
set -e
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "/Users/nihat/coupleai"

BUNDLE_ID="com.nihtavci.coupleai"
PORT=8085
METRO_URL="http://127.0.0.1:${PORT}"

# ── Step 1: Terminate any running instance of the app ───────────────────────
echo "[sim-start] Terminating any running app instance..."
xcrun simctl terminate booted "${BUNDLE_ID}" 2>/dev/null || true
sleep 1

# ── Step 2: Kill stale Metro on the target port ──────────────────────────────
lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true

# ── Step 3: Clear iOS HTTP URL cache (removes stale expo.dev bundle responses)
CACHE_DB=$(find ~/Library/Developer/CoreSimulator/Devices -path "*/Caches/${BUNDLE_ID}/Cache.db" 2>/dev/null | head -1)
if [ -n "$CACHE_DB" ]; then
  sqlite3 "$CACHE_DB" "DELETE FROM cfurl_cache_response WHERE request_key LIKE '%expo.dev%';" 2>/dev/null && \
    echo "[sim-start] Cleared expo.dev entries from HTTP URL cache" || \
    echo "[sim-start] Warning: could not clear URL cache"
fi

# ── Step 4: Fix recent-servers plist ────────────────────────────────────────
# Remove expo.dev (and any other non-local URLs) AND seed localhost:8085.
# With DEV_CLIENT_TRY_TO_LAUNCH_LAST_BUNDLE=true (the default), the app reads
# mostRecentApp() from this plist on startup and auto-connects — bypassing the
# dev-launcher home screen entirely. The home screen makes API calls to
# expo.dev, which is the source of the [React] <!DOCTYPE html> logs.
PLIST_PATH=$(find ~/Library/Developer/CoreSimulator/Devices -name "${BUNDLE_ID}.plist" \
  -path "*/Containers/Data/Application/*/Library/Preferences/*" 2>/dev/null | head -1)

if [ -n "$PLIST_PATH" ]; then
  python3 - "$PLIST_PATH" "$METRO_URL" <<'PYEOF'
import sys, plistlib, time, urllib.parse

plist_path, metro_url = sys.argv[1], sys.argv[2]

def is_local(url):
    host = urllib.parse.urlparse(url).hostname or ''
    return (host in ('localhost', '127.0.0.1')
            or host.startswith('192.168.')
            or host.startswith('10.')
            or host.startswith('172.'))

try:
    with open(plist_path, 'rb') as f:
        data = plistlib.load(f)

    key = "expo.devlauncher.recentlyopenedapps"
    entries = data.get(key, {})
    if not isinstance(entries, dict):
        entries = {}

    before = list(entries.keys())
    # Keep only local addresses
    entries = {k: v for k, v in entries.items() if is_local(k)}
    removed = [k for k in before if k not in entries]
    if removed:
        print(f"[sim-start] Removed non-local server(s): {removed}", flush=True)

    # Seed localhost:8085 so the app auto-connects without showing the home screen
    entries[metro_url] = {
        'url': metro_url,
        'name': 'couple-ai',
        'isEASUpdate': False,
        'timestamp': int(time.time() * 1000),
    }
    print(f"[sim-start] Seeded {metro_url} as most-recent server", flush=True)

    data[key] = entries
    with open(plist_path, 'wb') as f:
        plistlib.dump(data, f)
except Exception as e:
    print(f"[sim-start] Warning: plist error: {e}", flush=True)
PYEOF
else
  echo "[sim-start] Warning: could not find app plist (fresh install — expo CLI will handle connect)"
fi

# ── Step 5: Start Metro with --ios ──────────────────────────────────────────
# expo start --ios sends the deep link after Metro is ready, which handles
# the fresh-install case where no plist exists yet.
# The plist seed above handles all subsequent runs without touching --initialUrl.
EXPO_NO_DEPENDENCY_VALIDATION=1 npx expo start --port ${PORT} --localhost --ios
