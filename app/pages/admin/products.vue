<script setup lang="ts">
import type { Product } from '~/types/admin'
import { shallowRef } from 'vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: products, refresh } = await useFetch<Product[]>('/api/admin/products')

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
    <div class="products-header">
      <h1 class="page-title products-title">
        Products
      </h1>
      <button class="btn btn-primary" type="button" @click="openCreate">
        + Add product
      </button>
    </div>

    <AdminProductForm
      v-if="showForm"
      :key="editing?.id ?? 'new'"
      :product="editing"
      @saved="onSaved"
      @cancel="showForm = false"
    />

    <div class="card table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>
              <p class="product-name">{{ product.name }}</p>
              <p class="product-description">{{ product.description }}</p>
            </td>
            <td>{{ formatPrice(product.priceCents, product.currency) }}</td>
            <td>{{ product.stock }}</td>
            <td>
              <span class="badge" :class="product.active ? 'badge-delivered' : 'badge-muted'">
                {{ product.active ? 'active' : 'hidden' }}
              </span>
            </td>
            <td class="product-actions">
              <button class="btn" type="button" @click="openEdit(product)">
                Edit
              </button>
              <button class="btn" type="button" @click="toggleActive(product)">
                {{ product.active ? 'Hide' : 'Show' }}
              </button>
            </td>
          </tr>
          <tr v-if="products && products.length === 0">
            <td colspan="5" class="products-empty">
              No products yet — add your first one.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.products-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.products-title {
  margin-bottom: 0;
}

.table-wrap {
  overflow-x: auto;
}

.product-name {
  margin: 0;
  font-weight: 600;
}

.product-description {
  margin: 0;
  color: var(--muted);
  font-size: 0.83rem;
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-actions {
  white-space: nowrap;
  text-align: right;
}

.product-actions .btn {
  margin-left: 0.4rem;
}

.products-empty {
  text-align: center;
  color: var(--muted);
  padding: 2rem;
}
</style>
