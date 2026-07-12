import type { ModelMessage } from 'ai'
import { google } from '@ai-sdk/google'
import { generateText, stepCountIs, tool } from 'ai'
import { and, desc, eq, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { useDb } from '../db'
import { cartItems, orderItems, orders, products } from '../db/schema'

const SYSTEM_PROMPT = `You are a friendly shopping assistant for an online store, chatting with customers on WhatsApp.

Guidelines:
- Keep replies short and conversational — this is a chat, not an email.
- Use WhatsApp formatting only: *bold*, _italic_. Never use markdown headers, links or tables.
- Only quote products, prices and availability returned by your tools. Never invent products or discounts.
- If a search finds nothing, retry with synonyms or broader terms (e.g. "headphones" → "earbuds"), or browse the full catalog with listProducts. Only say something is unavailable after checking the catalog.
- When a customer wants to buy, add items to their cart and summarize it before checking out.
- Always ask for confirmation before placing an order.
- If you can't help with something, say so honestly and keep it brief.`

function formatPrice(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency}`
}

function toProductSummary(product: typeof products.$inferSelect) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: formatPrice(product.priceCents, product.currency),
    unitsInStock: product.stock,
  }
}

function buildTools(customerId: number) {
  const db = useDb()

  return {
    searchProducts: tool({
      description: 'Search the product catalog by name or description. Matching ignores case, spacing and word order ("smartwatch" finds "Smart Watch"). Returns up to 5 products.',
      inputSchema: z.object({
        query: z.string().describe('Search terms, e.g. "earbuds" or "smart watch"'),
      }),
      execute: async ({ query }) => {
        // Compare space-stripped lowercase text so compound words still hit,
        // and match each term independently so word order doesn't matter.
        const terms = query.toLowerCase().split(/\s+/)
          .map(term => term.replace(/[^\p{L}\p{N}]/gu, ''))
          .filter(Boolean)
        if (terms.length === 0) {
          return []
        }
        const termMatches = terms.map(term => or(
          sql`replace(lower(${products.name}), ' ', '') like ${`%${term}%`}`,
          sql`replace(lower(${products.description}), ' ', '') like ${`%${term}%`}`,
        ))
        const results = await db.select().from(products)
          .where(and(eq(products.active, true), or(...termMatches)))
          .limit(5)
        return results.map(toProductSummary)
      },
    }),

    listProducts: tool({
      description: 'List the whole product catalog. Use when a search finds nothing or the customer asks what is available.',
      inputSchema: z.object({}),
      execute: async () => {
        const results = await db.select().from(products)
          .where(eq(products.active, true))
          .orderBy(products.name)
          .limit(50)
        return results.map(toProductSummary)
      },
    }),

    addToCart: tool({
      description: 'Add a product to the customer\'s cart, or update its quantity if already there.',
      inputSchema: z.object({
        productId: z.number().int(),
        quantity: z.number().int().min(1).default(1),
      }),
      execute: async ({ productId, quantity }) => {
        const [product] = await db.select().from(products)
          .where(and(eq(products.id, productId), eq(products.active, true)))
        if (!product) {
          return { error: 'Product not found' }
        }
        if (product.stock < quantity) {
          return { error: `Only ${product.stock} left in stock` }
        }
        await db.insert(cartItems)
          .values({ customerId, productId, quantity })
          .onConflictDoUpdate({
            target: [cartItems.customerId, cartItems.productId],
            set: { quantity },
          })
        return { added: product.name, quantity }
      },
    }),

    removeFromCart: tool({
      description: 'Remove a product from the customer\'s cart.',
      inputSchema: z.object({
        productId: z.number().int(),
      }),
      execute: async ({ productId }) => {
        await db.delete(cartItems)
          .where(and(eq(cartItems.customerId, customerId), eq(cartItems.productId, productId)))
        return { removed: true }
      },
    }),

    viewCart: tool({
      description: 'List the items currently in the customer\'s cart with the total.',
      inputSchema: z.object({}),
      execute: async () => {
        const items = await db.select({
          productId: products.id,
          name: products.name,
          quantity: cartItems.quantity,
          priceCents: products.priceCents,
          currency: products.currency,
        })
          .from(cartItems)
          .innerJoin(products, eq(cartItems.productId, products.id))
          .where(eq(cartItems.customerId, customerId))
        const totalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0)
        return {
          items: items.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: formatPrice(item.priceCents, item.currency),
          })),
          total: formatPrice(totalCents, items[0]?.currency ?? 'USD'),
        }
      },
    }),

    checkout: tool({
      description: 'Place an order for everything in the cart. Only call this after the customer explicitly confirmed.',
      inputSchema: z.object({}),
      execute: async () => {
        const items = await db.select({
          productId: products.id,
          name: products.name,
          quantity: cartItems.quantity,
          priceCents: products.priceCents,
          currency: products.currency,
        })
          .from(cartItems)
          .innerJoin(products, eq(cartItems.productId, products.id))
          .where(eq(cartItems.customerId, customerId))
        if (items.length === 0) {
          return { error: 'The cart is empty' }
        }
        const totalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0)
        const currency = items[0]!.currency

        const [order] = await db.insert(orders)
          .values({ customerId, totalCents, currency })
          .returning({ id: orders.id })
        await db.insert(orderItems).values(items.map(item => ({
          orderId: order!.id,
          productId: item.productId,
          quantity: item.quantity,
          priceCents: item.priceCents,
        })))
        await db.delete(cartItems).where(eq(cartItems.customerId, customerId))

        return { orderId: order!.id, total: formatPrice(totalCents, currency), status: 'pending' }
      },
    }),

    getOrderStatus: tool({
      description: 'Look up the status of the customer\'s orders. Pass an order id to check a specific one.',
      inputSchema: z.object({
        orderId: z.number().int().optional(),
      }),
      execute: async ({ orderId }) => {
        const conditions = [eq(orders.customerId, customerId)]
        if (orderId !== undefined) {
          conditions.push(eq(orders.id, orderId))
        }
        const results = await db.select().from(orders)
          .where(and(...conditions))
          .orderBy(desc(orders.createdAt))
          .limit(5)
        return results.map(order => ({
          orderId: order.id,
          status: order.status,
          total: formatPrice(order.totalCents, order.currency),
          placedAt: order.createdAt.toISOString(),
        }))
      },
    }),
  }
}

/**
 * Run one turn of the sales agent: the model reads the conversation and may
 * call catalog/cart/order tools before producing the reply text.
 */
export async function generateReply(customerId: number, conversation: ModelMessage[]) {
  const result = await generateText({
    model: google('gemini-2.5-flash'),
    system: SYSTEM_PROMPT,
    messages: conversation,
    tools: buildTools(customerId),
    stopWhen: stepCountIs(6),
  })
  return result.text.trim() || 'Sorry, I had trouble answering that. Could you rephrase?'
}
