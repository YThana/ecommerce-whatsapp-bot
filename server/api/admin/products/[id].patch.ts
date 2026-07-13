import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb } from '../../../db'
import { products } from '../../../db/schema'

const bodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  priceCents: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  imageUrl: z.string().url().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid product id' })
  }
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = useDb()
  const [updated] = await db.update(products).set(body).where(eq(products.id, id)).returning()
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }
  return updated
})
