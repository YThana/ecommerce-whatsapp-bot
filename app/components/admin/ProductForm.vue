<script setup lang="ts">
import type { Product } from '~/types/admin'
import { reactive, shallowRef } from 'vue'

const props = defineProps<{
  product: Product | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const form = reactive({
  name: props.product?.name ?? '',
  description: props.product?.description ?? '',
  price: props.product ? (props.product.priceCents / 100).toFixed(2) : '',
  currency: props.product?.currency ?? 'USD',
  stock: props.product?.stock ?? 0,
  imageUrl: props.product?.imageUrl ?? '',
})

const saving = shallowRef(false)
const error = shallowRef('')

async function submit() {
  saving.value = true
  error.value = ''
  const body = {
    name: form.name,
    description: form.description,
    priceCents: Math.round(Number(form.price) * 100),
    currency: form.currency.toUpperCase(),
    stock: Number(form.stock),
    imageUrl: form.imageUrl || null,
  }
  try {
    if (props.product) {
      await $fetch(`/api/admin/products/${props.product.id}`, { method: 'PATCH', body })
    }
    else {
      await $fetch('/api/admin/products', { method: 'POST', body })
    }
    emit('saved')
  }
  catch {
    error.value = 'Could not save the product — check the values and try again.'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="card product-form" @submit.prevent="submit">
    <h2 class="product-form-title">
      {{ product ? `Edit “${product.name}”` : 'New product' }}
    </h2>

    <div class="product-form-grid">
      <div class="product-form-span">
        <label class="label" for="pf-name">Name</label>
        <input id="pf-name" v-model="form.name" class="field" required maxlength="200">
      </div>
      <div class="product-form-span">
        <label class="label" for="pf-description">Description</label>
        <textarea id="pf-description" v-model="form.description" class="field" rows="2" maxlength="2000" />
      </div>
      <div>
        <label class="label" for="pf-price">Price</label>
        <input id="pf-price" v-model="form.price" class="field" type="number" min="0" step="0.01" required>
      </div>
      <div>
        <label class="label" for="pf-currency">Currency</label>
        <input id="pf-currency" v-model="form.currency" class="field" maxlength="3" minlength="3" required>
      </div>
      <div>
        <label class="label" for="pf-stock">Stock</label>
        <input id="pf-stock" v-model.number="form.stock" class="field" type="number" min="0" step="1" required>
      </div>
      <div>
        <label class="label" for="pf-image">Image URL (optional)</label>
        <input id="pf-image" v-model="form.imageUrl" class="field" type="url" placeholder="https://…">
      </div>
    </div>

    <p v-if="error" class="error-text">
      {{ error }}
    </p>

    <div class="product-form-actions">
      <button class="btn" type="button" @click="emit('cancel')">
        Cancel
      </button>
      <button class="btn btn-primary" type="submit" :disabled="saving">
        {{ saving ? 'Saving…' : 'Save product' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.product-form {
  padding: 1.3rem;
  margin-bottom: 1.2rem;
}

.product-form-title {
  font-size: 1.02rem;
  margin-bottom: 1rem;
}

.product-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.8rem;
}

.product-form-span {
  grid-column: 1 / -1;
}

.product-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1rem;
}
</style>
