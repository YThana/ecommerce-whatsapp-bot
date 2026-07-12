#!/bin/bash
# Starts the WhatsApp bot dev environment: cloudflared tunnel + Nuxt dev server.
# Double-click in Finder, or run ./start-bot.command from a terminal.
# Ctrl-C (or closing the window) stops the dev server; the tunnel keeps
# running in the background so its URL stays valid between restarts.

# Finder launches with a minimal PATH — add the usual tool locations
export PATH="$HOME/Library/pnpm:/opt/homebrew/bin:/usr/local/bin:$PATH"

cd "$(dirname "$0")" || exit 1

TUNNEL_LOG=/tmp/tunnel.log
PORT=3000

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
  echo
  echo "  ⚠️  NEW tunnel URL — update the callback URL in Meta"
  echo "     (WhatsApp → Configuration → Edit → Verify and save):"
  echo
  echo "     $URL/api/whatsapp/webhook"
  echo
fi

echo "Starting dev server on port $PORT (Ctrl-C to stop)…"
pnpm dev
