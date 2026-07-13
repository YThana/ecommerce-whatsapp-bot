<script setup lang="ts">
import type { Order, OrderStatus } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: orders, status, refresh } = useFetch<Order[]>('/api/admin/orders', { lazy: true })

async function updateStatus(order: Order, newStatus: OrderStatus, done: () => void) {
  try {
    await $fetch(`/api/admin/orders/${order.id}`, { method: 'PATCH', body: { status: newStatus } })
    await refresh()
  }
  finally {
    done()
  }
}
</script>

<template>
  <div>
    <h1 class="mb-6 text-2xl font-bold">
      Orders
    </h1>

    <div v-if="status === 'pending'" class="max-w-2xl space-y-4">
      <USkeleton v-for="i in 3" :key="i" class="h-40 rounded-lg" />
    </div>

    <p v-else-if="orders && orders.length === 0" class="text-muted">
      No orders yet — they'll appear here when customers check out.
    </p>

    <div v-else class="grid max-w-2xl gap-4">
      <AdminOrderCard
        v-for="order in orders"
        :key="order.id"
        :order="order"
        @update-status="(newStatus, done) => updateStatus(order, newStatus, done)"
      />
    </div>
  </div>
</template>
