import type { ModelMessage } from 'ai'
import type { WhatsAppTextMessage, WhatsAppWebhookPayload } from '../../services/whatsapp'
import { asc, eq } from 'drizzle-orm'
import { useDb } from '../../db'
import { customers, messages } from '../../db/schema'
import { generateReply } from '../../services/agent'
import { markAsRead, sendTextMessage, verifyWebhookSignature } from '../../services/whatsapp'

// How much recent conversation the agent sees per turn
const HISTORY_LIMIT = 20

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const rawBody = await readRawBody(event)
  const signature = getHeader(event, 'x-hub-signature-256')
  if (!rawBody || !verifyWebhookSignature(rawBody, signature, config.whatsappAppSecret)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }

  const payload = JSON.parse(rawBody) as WhatsAppWebhookPayload

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

async function handleMessage(message: WhatsAppTextMessage, contactName: string | undefined) {
  if (message.type !== 'text' || !message.text?.body) {
    await sendTextMessage(message.from, 'Sorry, I can only read text messages for now 🙏')
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
      content: message.text.body,
      waMessageId: message.id,
    })
    .onConflictDoNothing({ target: messages.waMessageId })
    .returning({ id: messages.id })
  if (inserted.length === 0) {
    return
  }

  await markAsRead(message.id)

  const history = await db.select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.customerId, customer!.id))
    .orderBy(asc(messages.createdAt), asc(messages.id))
    .then(rows => rows.slice(-HISTORY_LIMIT))

  const reply = await generateReply(
    customer!.id,
    history.map(row => ({ role: row.role, content: row.content }) satisfies ModelMessage),
  )

  await db.insert(messages).values({
    customerId: customer!.id,
    role: 'assistant',
    content: reply,
  })
  await sendTextMessage(message.from, reply)
}
