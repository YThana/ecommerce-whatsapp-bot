<script setup lang="ts">
import type { Order, OrderStatus } from '~/types/admin'

defineProps<{
  order: Order
}>()

const emit = defineEmits<{
  updateStatus: [status: OrderStatus]
}>()

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

function onStatusChange(event: Event) {
  emit('updateStatus', (event.target as HTMLSelectElement).value as OrderStatus)
}
</script>

<template>
  <article class="card order-card">
    <header class="order-header">
      <div>
        <h2 class="order-id">
          Order #{{ order.id }}
          <span class="badge" :class="`badge-${order.status}`">{{ order.status }}</span>
        </h2>
        <p class="order-meta">
          {{ order.customerName || order.customerWaId }} · {{ formatDateTime(order.createdAt) }}
        </p>
      </div>
      <select class="field order-status" :value="order.status" @change="onStatusChange">
        <option v-for="status in STATUSES" :key="status" :value="status">
          {{ status }}
        </option>
      </select>
    </header>

    <ul class="order-items">
      <li v-for="item in order.items" :key="`${item.orderId}-${item.productName}`" class="order-item">
        <span>{{ item.quantity }} × {{ item.productName }}</span>
        <span>{{ formatPrice(item.priceCents * item.quantity, order.currency) }}</span>
      </li>
    </ul>

    <footer class="order-total">
      <span>Total</span>
      <span>{{ formatPrice(order.totalCents, order.currency) }}</span>
    </footer>
  </article>
</template>

<style scoped>
.order-card {
  padding: 1.1rem 1.3rem;
}

.order-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}

.order-id {
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.order-meta {
  margin: 0.15rem 0 0;
  color: var(--muted);
  font-size: 0.85rem;
}

.order-status {
  width: auto;
}

.order-items {
  list-style: none;
  margin: 0.9rem 0 0;
  padding: 0;
}

.order-item {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px dashed var(--border);
  font-size: 0.92rem;
}

.order-total {
  display: flex;
  justify-content: space-between;
  padding-top: 0.55rem;
  font-weight: 700;
}
</style>
