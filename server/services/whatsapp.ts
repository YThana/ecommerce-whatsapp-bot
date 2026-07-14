import { Buffer } from 'node:buffer'
import { createHmac, timingSafeEqual } from 'node:crypto'

const GRAPH_API_URL = 'https://graph.facebook.com/v23.0'

// WhatsApp rejects text messages longer than 4096 characters
const MAX_TEXT_LENGTH = 4096

export interface WhatsAppIncomingMessage {
  from: string
  id: string
  type: string
  text?: { body: string }
  interactive?: {
    type: string
    button_reply?: { id: string, title: string }
    list_reply?: { id: string, title: string, description?: string }
  }
}

/** An interactive message queued by the agent, sent after the turn completes. */
export type OutgoingInteractive =
  | { kind: 'buttons', text: string, buttons: { id: string, title: string }[] }
  | { kind: 'list', text: string, buttonLabel: string, items: { id: string, title: string, description?: string }[] }

export interface WhatsAppWebhookPayload {
  object: string
  entry?: {
    changes?: {
      field: string
      value: {
        contacts?: { wa_id: string, profile?: { name?: string } }[]
        messages?: WhatsAppIncomingMessage[]
      }
    }[]
  }[]
}

/**
 * Verify the X-Hub-Signature-256 header Meta sends with every webhook,
 * an HMAC-SHA256 of the raw request body keyed with the app secret.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined, appSecret: string) {
  if (!signatureHeader?.startsWith('sha256=')) {
    return false
  }
  const expected = createHmac('sha256', appSecret).update(rawBody).digest()
  const received = Buffer.from(signatureHeader.slice('sha256='.length), 'hex')
  return received.length === expected.length && timingSafeEqual(received, expected)
}

async function callGraphApi(path: string, body: Record<string, unknown>) {
  const config = useRuntimeConfig()
  return $fetch(`${GRAPH_API_URL}/${config.whatsappPhoneNumberId}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.whatsappAccessToken}` },
    body,
  })
}

export async function sendTextMessage(to: string, text: string) {
  const body = text.length > MAX_TEXT_LENGTH ? `${text.slice(0, MAX_TEXT_LENGTH - 1)}…` : text
  try {
    await callGraphApi('messages', {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body },
    })
  }
  catch (error: any) {
    // Surface the Graph API error payload — it names the exact cause
    // (expired token, recipient not in allowed list, 24h window, …)
    console.error('[whatsapp] send failed:', JSON.stringify(error?.data ?? String(error)))
    throw error
  }
}

// WhatsApp's hard limits for interactive messages
const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value)

export async function sendInteractive(to: string, message: OutgoingInteractive) {
  const interactive = message.kind === 'buttons'
    ? {
        type: 'button',
        body: { text: clip(message.text, 1024) },
        action: {
          buttons: message.buttons.slice(0, 3).map(button => ({
            type: 'reply',
            reply: { id: clip(button.id, 200), title: clip(button.title, 20) },
          })),
        },
      }
    : {
        type: 'list',
        body: { text: clip(message.text, 1024) },
        action: {
          button: clip(message.buttonLabel, 20),
          sections: [{
            rows: message.items.slice(0, 10).map(item => ({
              id: clip(item.id, 200),
              title: clip(item.title, 24),
              ...(item.description ? { description: clip(item.description, 72) } : {}),
            })),
          }],
        },
      }

  try {
    await callGraphApi('messages', {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive,
    })
  }
  catch (error: any) {
    console.error('[whatsapp] interactive send failed:', JSON.stringify(error?.data ?? String(error)))
    throw error
  }
}

/** Show the customer a read receipt and typing indicator while the reply is generated. */
export async function markAsRead(messageId: string) {
  await callGraphApi('messages', {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
    typing_indicator: { type: 'text' },
  }).catch(() => {
    // Read receipts are cosmetic — never fail the webhook over them
  })
}
