<script setup lang="ts">
import type { Order, OrderStatus } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: orders, refresh } = await useFetch<Order[]>('/api/admin/orders')

async function updateStatus(order: Order, status: OrderStatus) {
  await $fetch(`/api/admin/orders/${order.id}`, { method: 'PATCH', body: { status } })
  await refresh()
}
</script>

<template>
  <div>
    <h1 class="page-title">
      Orders
    </h1>
    <p v-if="orders && orders.length === 0" class="orders-empty">
      No orders yet — they'll appear here when customers check out.
    </p>
    <div class="orders-list">
      <AdminOrderCard
        v-for="order in orders"
        :key="order.id"
        :order="order"
        @update-status="updateStatus(order, $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.orders-list {
  display: grid;
  gap: 1rem;
  max-width: 720px;
}

.orders-empty {
  color: var(--muted);
}
</style>
