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

- **Nuxt 4** — the Nitro server handles Meta's webhooks; the Vue app is a password-protected admin dashboard (`/admin`) with product management, order tracking and a conversation viewer.
- **Vercel AI SDK + Gemini** — the agent decides when to search products, manage the cart or place orders via typed tools.
- **Neon Postgres + Drizzle** — products, customers, conversation history, carts and orders.

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

```bash
pnpm dev
```

Expose port 3000 with a tunnel (e.g. `ngrok http 3000`), then in the Meta app dashboard under **WhatsApp → Configuration**:

- Callback URL: `https://<your-tunnel>/api/whatsapp/webhook`
- Verify token: the value of `NUXT_WHATSAPP_VERIFY_TOKEN`
- Subscribe to the **messages** webhook field

Send a WhatsApp message to your test number and the bot replies.

### 5. Admin dashboard

Open `http://localhost:3000/admin` and sign in with `NUXT_ADMIN_PASSWORD`. From there you can manage the catalog, update order statuses and read customer conversations. (`NUXT_SESSION_PASSWORD` must be set to any random 32+ character string — it seals the session cookie.)

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
- **Dev tunnel URL changed** — quick tunnels (e.g. `cloudflared tunnel --url http://localhost:3000`) get a new URL on every restart; update and re-verify the callback URL in Meta. The dev server already allows `.trycloudflare.com` hosts via `vite.server.allowedHosts` in `nuxt.config.ts`.

The webhook handler logs every stage (`[webhook] received`, `[agent] reply`, `[whatsapp] send failed` with Meta's exact error body), so the dev server console tells you which link in the chain broke.

## Deployment

Deploys to [Vercel](https://vercel.com/) out of the box — import the repo, add the variables from `.env.example` as environment variables, and point the Meta webhook at `https://<your-app>.vercel.app/api/whatsapp/webhook`.

## Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | Start the dev server                 |
| `pnpm build`     | Build for production                 |
| `pnpm typecheck` | Type-check the project               |
| `pnpm db:push`   | Sync the Drizzle schema to Postgres  |
| `pnpm db:seed`   | Insert sample products               |
| `pnpm db:studio` | Browse the database in Drizzle Studio |
