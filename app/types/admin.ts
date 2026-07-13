export interface Product {
  id: number
  name: string
  description: string
  priceCents: number
  currency: string
  imageUrl: string | null
  stock: number
  active: boolean
  createdAt: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  orderId: number
  quantity: number
  priceCents: number
  productName: string
}

export interface Order {
  id: number
  status: OrderStatus
  totalCents: number
  currency: string
  createdAt: string
  customerName: string | null
  customerWaId: string
  items: OrderItem[]
}

export interface Conversation {
  id: number
  waId: string
  name: string | null
  messageCount: number
  lastMessageAt: string | null
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}
