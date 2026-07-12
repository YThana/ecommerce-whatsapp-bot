import { boolean, integer, pgTable, serial, text, timestamp, unique, varchar } from 'drizzle-orm/pg-core'

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  priceCents: integer('price_cents').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  imageUrl: text('image_url'),
  stock: integer('stock').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  // WhatsApp ID — the customer's phone number in international format
  waId: varchar('wa_id', { length: 20 }).notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  role: varchar('role', { length: 10 }).notNull().$type<'user' | 'assistant'>(),
  content: text('content').notNull(),
  // Meta redelivers webhooks; the unique constraint lets us drop duplicates
  waMessageId: varchar('wa_message_id', { length: 128 }).unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull().default(1),
}, table => [unique().on(table.customerId, table.productId)])

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  status: varchar('status', { length: 20 }).notNull().default('pending')
    .$type<'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'>(),
  totalCents: integer('total_cents').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  // Unit price captured at purchase time, so later catalog edits don't rewrite history
  priceCents: integer('price_cents').notNull(),
})
