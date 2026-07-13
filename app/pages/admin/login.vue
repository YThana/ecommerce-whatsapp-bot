<script setup lang="ts">
import { shallowRef } from 'vue'

const password = shallowRef('')
const error = shallowRef('')
const loading = shallowRef(false)

async function submit() {
  if (!password.value || loading.value) {
    return
  }
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: { password: password.value },
    })
    await navigateTo('/admin')
  }
  catch {
    error.value = 'Wrong password, try again.'
    loading.value = false
  }
}
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-elevated/25 p-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <div class="flex items-center gap-2 font-bold">
          <span class="text-xl">🛍️</span>
          <span>Shop Admin</span>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="submit">
        <UFormField label="Password" name="password" :error="error || undefined">
          <UInput
            v-model="password"
            type="password"
            placeholder="Enter the admin password"
            icon="i-lucide-lock"
            autocomplete="current-password"
            autofocus
            class="w-full"
            size="lg"
          />
        </UFormField>
        <UButton
          type="submit"
          label="Sign in"
          block
          size="lg"
          :loading="loading"
          :disabled="!password"
        />
      </form>
    </UCard>
  </div>
</template>
