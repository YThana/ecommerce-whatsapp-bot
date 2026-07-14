import type { ModelMessage } from 'ai'
import type { OutgoingInteractive, WhatsAppIncomingMessage, WhatsAppWebhookPayload } from '../../services/whatsapp'
import { asc, eq } from 'drizzle-orm'
import { useDb } from '../../db'
import { customers, messages } from '../../db/schema'
import { generateReply } from '../../services/agent'
import { markAsRead, sendInteractive, sendTextMessage, verifyWebhookSignature } from '../../services/whatsapp'

// How much recent conversation the agent sees per turn
const HISTORY_LIMIT = 20

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const rawBody = await readRawBody(event)
  const signature = getHeader(event, 'x-hub-signature-256')
  if (!rawBody || !verifyWebhookSignature(rawBody, signature, config.whatsappAppSecret)) {
    console.error('[webhook] rejected: invalid signature (has body: %s, has header: %s)', !!rawBody, !!signature)
    throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }

  const payload = JSON.parse(rawBody) as WhatsAppWebhookPayload
  console.log('[webhook] received:', JSON.stringify(payload))

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') {
        continue
      }
      const contactName = change.value.contacts?.[0]?.profile?.name
      for (const message of change.value.messages ?? []) {
        // Never fail the whole webhook over one message: Meta would retry
        // the batch and other customers would get duplicate processing.
        await handleMessage(message, contactName).catch((error) => {
          console.error('Failed to handle WhatsApp message', message.id, error)
        })
      }
    }
  }

  return { received: true }
})

/** What the agent should read as the customer's words, for text or a tapped option. */
function extractUserContent(message: WhatsAppIncomingMessage): string | null {
  if (message.type === 'text' && message.text?.body) {
    return message.text.body
  }
  if (message.type === 'interactive') {
    const reply = message.interactive?.button_reply ?? message.interactive?.list_reply
    if (reply) {
      return `[Selected: ${reply.title} (id: ${reply.id})]`
    }
  }
  // Carousel quick-reply taps arrive as a plain "button" message
  if (message.type === 'button' && message.button?.text) {
    return `[Selected: ${message.button.text} (id: ${message.button.payload ?? 'unknown'})]`
  }
  return null
}

/** How an interactive message is recorded in history so the model remembers what it offered. */
function describeInteractive(message: OutgoingInteractive) {
  if (message.kind === 'buttons') {
    const photo = message.imageUrl ? '[Product photo]\n' : ''
    return `${photo}${message.text}\n[Buttons: ${message.buttons.map(button => button.title).join(' | ')}]`
  }
  if (message.kind === 'carousel') {
    const names = message.cards.map(card => card.text.split('\n')[0]).join(' | ')
    return `${message.text}\n[Carousel of product cards: ${names}]`
  }
  return `${message.text}\n[Menu "${message.buttonLabel}": ${message.items.map(item => item.title).join(' | ')}]`
}

async function handleMessage(message: WhatsAppIncomingMessage, contactName: string | undefined) {
  console.log('[webhook] message %s from %s (type: %s)', message.id, message.from, message.type)

  // Fire immediately so the customer sees the blue ticks and typing indicator
  // right away; it runs in parallel with the work below (and never throws)
  const readReceipt = markAsRead(message.id)

  const userContent = extractUserContent(message)
  if (!userContent) {
    await sendTextMessage(message.from, 'Sorry, I can only read text messages for now 🙏')
    await readReceipt
    return
  }

  const db = useDb()

  const [customer] = await db.insert(customers)
    .values({ waId: message.from, name: contactName })
    .onConflictDoUpdate({ target: customers.waId, set: { name: contactName } })
    .returning()

  // Recording the message first doubles as dedupe: Meta redelivers webhooks
  // it considers unanswered, and the unique wa_message_id rejects the copy.
  const inserted = await db.insert(messages)
    .values({
      customerId: customer!.id,
      role: 'user',
      content: userContent,
      waMessageId: message.id,
    })
    .onConflictDoNothing({ target: messages.waMessageId })
    .returning({ id: messages.id })
  if (inserted.length === 0) {
    console.log('[webhook] duplicate delivery of %s, skipping', message.id)
    await readReceipt
    return
  }

  const history = await db.select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.customerId, customer!.id))
    .orderBy(asc(messages.createdAt), asc(messages.id))
    .then(rows => rows.slice(-HISTORY_LIMIT))

  const reply = await generateReply(
    customer!.id,
    history.map(row => ({ role: row.role, content: row.content }) satisfies ModelMessage),
  )

  const historyContent = [
    ...(reply.text ? [reply.text] : []),
    ...reply.interactive.map(describeInteractive),
  ].join('\n')
  console.log('[agent] reply for %s: %s', message.from, historyContent)

  await db.insert(messages).values({
    customerId: customer!.id,
    role: 'assistant',
    content: historyContent,
  })
  if (reply.text) {
    await sendTextMessage(message.from, reply.text)
  }
  for (const interactive of reply.interactive) {
    await sendInteractive(message.from, interactive)
  }
  console.log('[webhook] reply delivered to %s', message.from)
  await readReceipt
}
