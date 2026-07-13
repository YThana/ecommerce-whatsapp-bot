import { desc, eq, inArray } from 'drizzle-orm'
import { useDb } from '../../db'
import { customers, orderItems, orders, products } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()

  const orderRows = await db.select({
    id: orders.id,
    status: orders.status,
    totalCents: orders.totalCents,
    currency: orders.currency,
    createdAt: orders.createdAt,
    customerName: customers.name,
    customerWaId: customers.waId,
  })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .orderBy(desc(orders.createdAt))
    .limit(200)

  const orderIds = orderRows.map(order => order.id)
  const itemRows = orderIds.length === 0
    ? []
    : await db.select({
        orderId: orderItems.orderId,
        quantity: orderItems.quantity,
        priceCents: orderItems.priceCents,
        productName: products.name,
      })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(inArray(orderItems.orderId, orderIds))

  return orderRows.map(order => ({
    ...order,
    items: itemRows.filter(item => item.orderId === order.id),
  }))
})
