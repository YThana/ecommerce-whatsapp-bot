<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { shallowRef } from 'vue'

const links: NavigationMenuItem[] = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/admin', exact: true },
  { label: 'Products', icon: 'i-lucide-package', to: '/admin/products' },
  { label: 'Orders', icon: 'i-lucide-receipt', to: '/admin/orders' },
  { label: 'Conversations', icon: 'i-lucide-message-circle', to: '/admin/conversations' },
]

const signingOut = shallowRef(false)

async function logout() {
  signingOut.value = true
  try {
    await $fetch('/api/admin/logout', { method: 'POST' })
    await navigateTo('/admin/login')
  }
  finally {
    signingOut.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col md:flex-row">
    <aside class="flex w-full shrink-0 flex-col border-b border-default bg-elevated/50 p-4 md:sticky md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r">
      <div class="mb-4 flex items-center gap-2 px-1.5 font-bold">
        <span class="text-xl">🛍️</span>
        <span>Shop Admin</span>
      </div>
      <UNavigationMenu
        :items="links"
        orientation="vertical"
        class="flex-1"
      />
      <UButton
        icon="i-lucide-log-out"
        label="Sign out"
        color="neutral"
        variant="ghost"
        :loading="signingOut"
        class="mt-4"
        @click="logout"
      />
    </aside>
    <main class="min-w-0 flex-1 p-4 md:p-8">
      <slot />
    </main>
  </div>
</template>
