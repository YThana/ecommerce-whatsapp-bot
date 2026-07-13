import { count, eq, gte } from 'drizzle-orm'
import { useDb } from '../../db'
import { customers, messages, orders, products } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [productCount, customerCount, pendingOrders, messagesToday] = await Promise.all([
    db.select({ n: count() }).from(products).where(eq(products.active, true)),
    db.select({ n: count() }).from(customers),
    db.select({ n: count() }).from(orders).where(eq(orders.status, 'pending')),
    db.select({ n: count() }).from(messages).where(gte(messages.createdAt, todayStart)),
  ])

  return {
    products: productCount[0]!.n,
    customers: customerCount[0]!.n,
    pendingOrders: pendingOrders[0]!.n,
    messagesToday: messagesToday[0]!.n,
  }
})
