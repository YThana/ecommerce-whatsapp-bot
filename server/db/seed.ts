import { useDb } from './index'
import { products } from './schema'

function placeholderImage(label: string) {
  return `https://placehold.co/800x600/0e9f6e/white/jpeg?text=${encodeURIComponent(label)}`
}

const sampleProducts: typeof products.$inferInsert[] = [
  {
    name: 'Wireless Earbuds Pro',
    description: 'Noise-cancelling Bluetooth earbuds with 30h battery life and wireless charging case.',
    priceCents: 7999,
    stock: 25,
    imageUrl: placeholderImage('Wireless Earbuds Pro'),
  },
  {
    name: 'Smart Watch S2',
    description: 'Fitness tracking, heart-rate monitor, sleep analysis and 7-day battery. Water resistant.',
    priceCents: 12999,
    stock: 15,
    imageUrl: placeholderImage('Smart Watch S2'),
  },
  {
    name: 'Portable Power Bank 20000mAh',
    description: 'Fast-charging USB-C power bank, charges a phone up to 4 times.',
    priceCents: 3499,
    stock: 40,
    imageUrl: placeholderImage('Power Bank'),
  },
  {
    name: 'Bluetooth Speaker Mini',
    description: 'Compact waterproof speaker with surprisingly big sound and 12h playtime.',
    priceCents: 2999,
    stock: 30,
    imageUrl: placeholderImage('Speaker Mini'),
  },
  {
    name: 'USB-C Fast Charger 65W',
    description: 'GaN wall charger, powers laptops and phones from a single compact plug.',
    priceCents: 2499,
    stock: 50,
    imageUrl: placeholderImage('Fast Charger'),
  },
]

async function seed() {
  const db = useDb()
  const inserted = await db.insert(products).values(sampleProducts).returning({ id: products.id })
  console.log(`Seeded ${inserted.length} products`)
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
