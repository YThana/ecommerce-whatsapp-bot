/**
 * Webhook verification handshake: when the webhook URL is registered in the
 * Meta app dashboard, Meta sends a GET with a challenge that must be echoed.
 * https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  if (query['hub.mode'] === 'subscribe' && query['hub.verify_token'] === config.whatsappVerifyToken) {
    return query['hub.challenge']
  }

  throw createError({ statusCode: 403, statusMessage: 'Webhook verification failed' })
})
