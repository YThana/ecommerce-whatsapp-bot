import { createHash, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

const bodySchema = z.object({ password: z.string().min(1) })

function safeEqual(a: string, b: string) {
  // Hash both sides so the comparison is constant-time regardless of length
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.adminPassword) {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_ADMIN_PASSWORD is not set' })
  }

  const { password } = await readValidatedBody(event, bodySchema.parse)
  if (!safeEqual(password, config.adminPassword)) {
    throw createError({ statusCode: 401, statusMessage: 'Wrong password' })
  }

  const session = await useAdminSession(event)
  await session.update({ admin: true })
  return { ok: true }
})
