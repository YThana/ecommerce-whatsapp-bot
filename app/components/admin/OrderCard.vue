<script setup lang="ts">
import type { Order, OrderStatus } from '~/types/admin'
import { computed, shallowRef } from 'vue'

const props = defineProps<{
  order: Order
}>()

const emit = defineEmits<{
  updateStatus: [status: OrderStatus, done: () => void]
}>()

const STATUS_ITEMS: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

const STATUS_COLORS: Record<OrderStatus, 'warning' | 'info' | 'primary' | 'success' | 'error'> = {
  pending: 'warning',
  confirmed: 'info',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'error',
}

const updating = shallowRef(false)

const status = computed({
  get: () => props.order.status,
  set: (value: OrderStatus) => {
    updating.value = true
    emit('updateStatus', value, () => {
      updating.value = false
    })
  },
})
</script>

<template>
  <UCard>
    <div class="flex items-start justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="font-semibold">Order #{{ order.id }}</h2>
          <UBadge :color="STATUS_COLORS[order.status]" variant="subtle" :label="order.status" />
        </div>
        <p class="mt-0.5 text-sm text-muted">
          {{ order.customerName || order.customerWaId }} · {{ formatDateTime(order.createdAt) }}
        </p>
      </div>
      <USelect
        v-model="status"
        :items="STATUS_ITEMS"
        :loading="updating"
        class="w-36"
      />
    </div>

    <ul class="mt-4">
      <li
        v-for="item in order.items"
        :key="`${item.orderId}-${item.productName}`"
        class="flex justify-between border-b border-dashed border-default py-2 text-sm last:border-b-0"
      >
        <span>{{ item.quantity }} × {{ item.productName }}</span>
        <span>{{ formatPrice(item.priceCents * item.quantity, order.currency) }}</span>
      </li>
    </ul>

    <div class="mt-2 flex justify-between border-t border-default pt-3 font-bold">
      <span>Total</span>
      <span>{{ formatPrice(order.totalCents, order.currency) }}</span>
    </div>
  </UCard>
</template>
