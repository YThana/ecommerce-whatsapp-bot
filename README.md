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

- **Nuxt 4** — the Nitro server handles Meta's webhooks; the Vue app is room for an admin dashboard.
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
