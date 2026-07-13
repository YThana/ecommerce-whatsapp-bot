import { count, desc, eq, max } from 'drizzle-orm'
import { useDb } from '../../db'
import { customers, messages } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()

  return db.select({
    id: customers.id,
    waId: customers.waId,
    name: customers.name,
    messageCount: count(messages.id),
    lastMessageAt: max(messages.createdAt),
  })
    .from(customers)
    .leftJoin(messages, eq(messages.customerId, customers.id))
    .groupBy(customers.id)
    .orderBy(desc(max(messages.createdAt)))
})
