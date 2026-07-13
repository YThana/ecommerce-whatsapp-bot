<script setup lang="ts">
import type { Product } from '~/types/admin'
import { shallowRef } from 'vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: products, status, refresh } = useFetch<Product[]>('/api/admin/products', { lazy: true })

const editing = shallowRef<Product | null>(null)
const showForm = shallowRef(false)

function openCreate() {
  editing.value = null
  showForm.value = true
}

function openEdit(product: Product) {
  editing.value = product
  showForm.value = true
}

async function onSaved() {
  showForm.value = false
  await refresh()
}

async function toggleActive(product: Product) {
  await $fetch(`/api/admin/products/${product.id}`, {
    method: 'PATCH',
    body: { active: !product.active },
  })
  await refresh()
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        Products
      </h1>
      <UButton icon="i-lucide-plus" label="Add product" @click="openCreate" />
    </div>

    <AdminProductForm
      v-if="showForm"
      :key="editing?.id ?? 'new'"
      :product="editing"
      @saved="onSaved"
      @cancel="showForm = false"
    />

    <div v-if="status === 'pending'" class="space-y-3">
      <USkeleton v-for="i in 5" :key="i" class="h-16 rounded-lg" />
    </div>

    <UCard v-else :ui="{ body: 'p-0 sm:p-0' }">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-default text-left text-xs uppercase tracking-wide text-muted">
            <th class="px-4 py-3 font-medium">Product</th>
            <th class="px-4 py-3 font-medium">Price</th>
            <th class="px-4 py-3 font-medium">Stock</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="product in products"
            :key="product.id"
            class="border-b border-default last:border-b-0 hover:bg-elevated/50"
          >
            <td class="px-4 py-3">
              <p class="font-medium">{{ product.name }}</p>
              <p class="max-w-md truncate text-xs text-muted">{{ product.description }}</p>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">{{ formatPrice(product.priceCents, product.currency) }}</td>
            <td class="px-4 py-3">{{ product.stock }}</td>
            <td class="px-4 py-3">
              <UBadge
                :color="product.active ? 'success' : 'neutral'"
                variant="subtle"
                :label="product.active ? 'active' : 'hidden'"
              />
            </td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <UButton
                icon="i-lucide-pencil"
                size="xs"
                color="neutral"
                variant="ghost"
                label="Edit"
                @click="openEdit(product)"
              />
              <UButton
                :icon="product.active ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                size="xs"
                color="neutral"
                variant="ghost"
                :label="product.active ? 'Hide' : 'Show'"
                @click="toggleActive(product)"
              />
            </td>
          </tr>
          <tr v-if="products && products.length === 0">
            <td colspan="5" class="px-4 py-10 text-center text-muted">
              No products yet — add your first one.
            </td>
          </tr>
        </tbody>
      </table>
    </UCard>
  </div>
</template>
