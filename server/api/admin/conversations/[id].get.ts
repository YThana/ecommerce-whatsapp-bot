import { asc, eq } from 'drizzle-orm'
import { useDb } from '../../../db'
import { messages } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid customer id' })
  }
  const db = useDb()
  return db.select({
    id: messages.id,
    role: messages.role,
    content: messages.content,
    createdAt: messages.createdAt,
  })
    .from(messages)
    .where(eq(messages.customerId, id))
    .orderBy(asc(messages.createdAt), asc(messages.id))
})
