#!/bin/bash
# Starts the WhatsApp bot dev environment: cloudflared tunnel + Nuxt dev server.
# Double-click in Finder, or run ./start-bot.command from a terminal.
#
# If the tunnel gets a new URL, the script updates the webhook callback URL in
# Meta automatically (needs META_APP_ID, NUXT_WHATSAPP_APP_SECRET and
# NUXT_WHATSAPP_VERIFY_TOKEN in .env).
#
# Ctrl-C (or closing the window) stops the dev server; the tunnel keeps
# running in the background so its URL stays valid between restarts.

# Finder launches with a minimal PATH — add the usual tool locations
export PATH="$HOME/Library/pnpm:/opt/homebrew/bin:/usr/local/bin:$PATH"

cd "$(dirname "$0")" || exit 1

TUNNEL_LOG=/tmp/tunnel.log
PORT=3000

env_val() { grep "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2-; }

APP_ID=$(env_val META_APP_ID)
APP_SECRET=$(env_val NUXT_WHATSAPP_APP_SECRET)
VERIFY_TOKEN=$(env_val NUXT_WHATSAPP_VERIFY_TOKEN)

if pgrep -f "cloudflared tunnel" >/dev/null; then
  URL=$(grep -o "https://[a-z0-9-]*\.trycloudflare\.com" "$TUNNEL_LOG" 2>/dev/null | head -1)
  echo "✔ Tunnel already running: ${URL:-unknown URL}"
else
  echo "Starting cloudflared tunnel…"
  rm -f "$TUNNEL_LOG"
  nohup cloudflared tunnel --url "http://localhost:$PORT" > "$TUNNEL_LOG" 2>&1 &
  URL=""
  for _ in $(seq 1 30); do
    URL=$(grep -o "https://[a-z0-9-]*\.trycloudflare\.com" "$TUNNEL_LOG" | head -1)
    [ -n "$URL" ] && break
    sleep 1
  done
  if [ -z "$URL" ]; then
    echo "✖ Tunnel failed to start — see $TUNNEL_LOG"
    exit 1
  fi
  echo "✔ Tunnel URL: $URL"
fi

# Keep Meta's webhook callback pointed at the current tunnel URL. Runs in the
# background: it waits for the dev server to answer the verification handshake
# locally, then registers the URL (Meta re-verifies it over the tunnel).
if [ -n "$APP_ID" ] && [ -n "$APP_SECRET" ] && [ -n "$VERIFY_TOKEN" ] && [ -n "$URL" ]; then
  (
    for _ in $(seq 1 60); do
      READY=$(curl -s -m 5 "http://localhost:$PORT/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=$VERIFY_TOKEN&hub.challenge=ready" 2>/dev/null)
      [ "$READY" = "ready" ] && break
      sleep 2
    done
    RESULT=$(curl -s -m 30 -X POST "https://graph.facebook.com/v23.0/$APP_ID/subscriptions" \
      --data-urlencode "object=whatsapp_business_account" \
      --data-urlencode "callback_url=$URL/api/whatsapp/webhook" \
      --data-urlencode "verify_token=$VERIFY_TOKEN" \
      --data-urlencode "fields=messages" \
      --data-urlencode "access_token=$APP_ID|$APP_SECRET")
    case "$RESULT" in
      *'"success":true'*) echo "✔ Meta callback URL set to $URL/api/whatsapp/webhook" ;;
      *) echo "✖ Could not update Meta callback URL automatically: $RESULT" ;;
    esac
  ) &
else
  echo "⚠ Missing META_APP_ID / app secret / verify token in .env —"
  echo "  update the callback URL in Meta manually if the tunnel URL changed."
fi

echo "Starting dev server on port $PORT (Ctrl-C to stop)…"
pnpm dev
