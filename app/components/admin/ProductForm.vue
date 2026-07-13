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
  price: props.product ? props.product.priceCents / 100 : 0,
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
  <UCard class="mb-6">
    <template #header>
      <h2 class="font-semibold">
        {{ product ? `Edit “${product.name}”` : 'New product' }}
      </h2>
    </template>

    <form class="space-y-4" @submit.prevent="submit">
      <UFormField label="Name" name="name" required>
        <UInput v-model="form.name" required maxlength="200" class="w-full" />
      </UFormField>

      <UFormField label="Description" name="description">
        <UTextarea v-model="form.description" :rows="2" maxlength="2000" class="w-full" />
      </UFormField>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UFormField label="Price" name="price" required>
          <UInputNumber v-model="form.price" :min="0" :step="0.01" class="w-full" />
        </UFormField>
        <UFormField label="Currency" name="currency" required>
          <UInput v-model="form.currency" maxlength="3" minlength="3" required class="w-full" />
        </UFormField>
        <UFormField label="Stock" name="stock" required>
          <UInputNumber v-model="form.stock" :min="0" :step="1" class="w-full" />
        </UFormField>
        <UFormField label="Image URL" name="imageUrl">
          <UInput v-model="form.imageUrl" type="url" placeholder="https://…" class="w-full" />
        </UFormField>
      </div>

      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        :title="error"
        icon="i-lucide-circle-alert"
      />

      <div class="flex justify-end gap-2">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="emit('cancel')" />
        <UButton type="submit" label="Save product" :loading="saving" />
      </div>
    </form>
  </UCard>
</template>
