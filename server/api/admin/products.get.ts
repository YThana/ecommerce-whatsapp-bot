import { desc } from 'drizzle-orm'
import { useDb } from '../../db'
import { products } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()
  return db.select().from(products).orderBy(desc(products.createdAt))
})
