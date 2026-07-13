import { z } from 'zod'
import { useDb } from '../../db'
import { products } from '../../db/schema'

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  priceCents: z.number().int().min(0),
  currency: z.string().length(3).default('USD'),
  imageUrl: z.string().url().nullable().optional(),
  stock: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = useDb()
  const [created] = await db.insert(products).values(body).returning()
  return created
})
