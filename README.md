# WhatsApp Ecommerce Bot

An AI shopping assistant that lives in WhatsApp. Customers browse the catalog, fill a cart and place orders entirely through chat — powered by the WhatsApp Cloud API, the Vercel AI SDK and Google Gemini.

## How it works

```
Customer ──▶ WhatsApp ──▶ Meta Cloud API ──webhook──▶ Nuxt server route
                                                          │
                                            AI agent (Gemini + tools:
                                            search, cart, checkout, orders)
                                                          │
Customer ◀── WhatsApp ◀── Meta Cloud API ◀── reply ───────┘
```

- **Nuxt 4 + Nuxt UI** — the Nitro server handles Meta's webhooks; the Vue app is a password-protected admin dashboard (`/admin`) with product management, order tracking and a conversation viewer.
- **Vercel AI SDK + Gemini** — the agent decides when to search products, manage the cart or place orders via typed tools. Defaults to `gemini-3.1-flash-lite` (best free-tier quota); override with `GEMINI_MODEL`.
- **Neon Postgres + Drizzle** — products, customers, conversation history, carts and orders.

## Features

- 🤖 AI sales agent with fuzzy product search, cart, checkout and order tracking — replies in WhatsApp formatting with instant read receipts and a typing indicator
- 🛒 Rich in-chat shopping UI, no Meta commerce catalog required:
  - **Product carousels** — 2–10 swipeable image cards, each with *Add to cart* / *Details* buttons
  - **Product cards** — photo header + live price/stock from the database + tap buttons
  - **List menus & reply buttons** — tappable options for browsing and confirmations
  - The agent picks the right format per situation; taps come back as structured selections, so a customer can complete a whole purchase without typing
- 🛠️ Admin dashboard: catalog CRUD (incl. product image URLs), order status management, WhatsApp-style conversation viewer, dark mode
- 🔁 Webhook dedupe (Meta redeliveries), signature verification, and per-stage pipeline logging
- 🚇 One-click dev startup on macOS that keeps the Meta callback URL in sync with your tunnel

## Setup

### 1. Prerequisites

- A [Meta developer app](https://developers.facebook.com/) with the **WhatsApp** product added (the free test number works fine to start)
- A [Google AI Studio API key](https://aistudio.google.com/apikey) (free tier)
- A [Neon](https://neon.tech/) Postgres database (free tier)

### 2. Install and configure

```bash
pnpm install
cp .env.example .env   # then fill in the values
```

### 3. Create and seed the database

```bash
pnpm db:push   # create tables
pnpm db:seed   # add sample products
```

### 4. Run and connect the webhook

**macOS one-click:** double-click `start-bot.command`. It:

1. starts a [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) quick tunnel — or reuses the running one so the URL (and Meta config) stays stable,
2. launches the dev server on port 3000,
3. waits until the tunnel URL is publicly reachable (fresh trycloudflare hostnames need time for DNS to propagate), then
4. registers the callback URL with Meta automatically, with retries (uses `META_APP_ID` + `NUXT_WHATSAPP_APP_SECRET` + `NUXT_WHATSAPP_VERIFY_TOKEN` from `.env`).

Watch for `✔ Meta callback URL set to …` in the terminal — once it appears, messages flow. Ctrl-C stops the dev server; the tunnel keeps running in the background on purpose.

**Windows one-click:** double-click `start-bot.bat` (runs `start-bot.ps1`). Same behavior — the dev server opens in its own window while the launcher window shows tunnel + Meta sync status. Requires [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) on your `PATH` (`winget install Cloudflare.cloudflared`).

**Manual alternative:**

```bash
pnpm dev
```

Expose port 3000 with a tunnel (e.g. `cloudflared tunnel --url http://localhost:3000`), then in the Meta app dashboard under **WhatsApp → Configuration**:

- Callback URL: `https://<your-tunnel>/api/whatsapp/webhook`
- Verify token: the value of `NUXT_WHATSAPP_VERIFY_TOKEN`
- Subscribe to the **messages** webhook field

Either way, also make sure your app is subscribed to your WABA (see [Troubleshooting](#webhook-verifies-but-no-messages-arrive-shadow-delivery) — the dashboard often skips this). Then send a WhatsApp message to your test number and the bot replies.

### 5. Admin dashboard

Open `http://localhost:3000/admin` and sign in with `NUXT_ADMIN_PASSWORD`. From there you can manage the catalog, update order statuses and read customer conversations. (`NUXT_SESSION_PASSWORD` must be set to any random 32+ character string — it seals the session cookie.)

### 6. Product images

Carousels and product cards show each product's `Image URL` (admin → Products → Edit). The URL must be a **direct, publicly reachable image** (no redirects — Meta's servers fetch it). Seeded products come with generated placeholder images so the visual flow works out of the box.

## Troubleshooting

### Webhook verifies but no messages arrive ("shadow delivery")

Meta's dashboard can verify your callback URL and subscribe you to the `messages` field while silently skipping a third required link: subscribing your **app** to your **WhatsApp Business Account (WABA)**. The dashboard's *Test* button still works (it uses Meta's internal app), which makes this extra confusing — real messages just vanish with no error anywhere.

Check what's subscribed to your WABA:

```bash
curl "https://graph.facebook.com/v23.0/<WABA_ID>/subscribed_apps?access_token=<ACCESS_TOKEN>"
```

If your app isn't in the list (or only "WA DevX Webhook Events 1P App" is), subscribe it:

```bash
curl -X POST "https://graph.facebook.com/v23.0/<WABA_ID>/subscribed_apps?access_token=<ACCESS_TOKEN>"
```

Your WABA ID is shown at the top of **WhatsApp → API Setup**, or in the `granular_scopes` of `GET /debug_token?input_token=<token>&access_token=<token>`. This is a one-time, account-level fix — it survives tunnel URL changes and redeployments.

### Other common causes

- **`messages` field not subscribed** — webhook verification alone delivers nothing; subscribe to `messages` under Webhook fields.
- **Expired access token** — the API Setup token lasts 24 hours; replies fail with an `OAuthException`. Use a permanent System User token (Business settings → System users) for anything longer than a quick test.
- **Recipient not in allow-list** — the test number can only message up to 5 numbers registered in the "To" list on the API Setup page. Sends fail with error `131030`.
- **Messages sent before setup was complete are gone** — Meta doesn't retroactively deliver; always test with a fresh message.
- **Dev tunnel URL changed** — quick tunnels get a new URL on every restart, and Meta keeps posting to the dead one. `start-bot.command` re-syncs the callback URL at startup; if the tunnel dies *while running*, restart via the script or update the URL in Meta manually. The dev server already allows `.trycloudflare.com` hosts via `vite.server.allowedHosts` in `nuxt.config.ts`.
- **Auto-sync fails with error #2200 / "Failed to resolve host"** — a brand-new tunnel hostname hasn't propagated through DNS yet. The startup script waits and retries for this; if doing it manually, wait a minute and re-verify.

The webhook handler logs every stage (`[webhook] received`, `[agent] reply`, `[whatsapp] send failed` with Meta's exact error body), so the dev server console tells you which link in the chain broke.

## Deployment

Deploys to [Vercel](https://vercel.com/) out of the box — import the repo, add the variables from `.env.example` as environment variables, and point the Meta webhook at `https://<your-app>.vercel.app/api/whatsapp/webhook`.

## Scripts

| Command             | Description                                        |
| ------------------- | -------------------------------------------------- |
| `start-bot.command` | macOS: tunnel + dev server + Meta callback sync    |
| `start-bot.bat`     | Windows: tunnel + dev server + Meta callback sync  |
| `pnpm dev`          | Start the dev server                               |
| `pnpm build`        | Build for production                               |
| `pnpm typecheck`    | Type-check the project                             |
| `pnpm db:push`      | Sync the Drizzle schema to Postgres                |
| `pnpm db:seed`      | Insert sample products                             |
| `pnpm db:studio`    | Browse the database in Drizzle Studio              |
