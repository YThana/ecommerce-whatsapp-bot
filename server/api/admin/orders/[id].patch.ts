import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb } from '../../../db'
import { orders } from '../../../db/schema'

const bodySchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid order id' })
  }
  const { status } = await readValidatedBody(event, bodySchema.parse)
  const db = useDb()
  const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning()
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }
  return updated
})
