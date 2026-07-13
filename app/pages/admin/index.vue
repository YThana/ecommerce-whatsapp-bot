<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: stats, status } = useFetch('/api/admin/stats', { lazy: true })
</script>

<template>
  <div>
    <h1 class="mb-6 text-2xl font-bold">
      Dashboard
    </h1>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <template v-if="status === 'pending'">
        <USkeleton v-for="i in 4" :key="i" class="h-24 rounded-lg" />
      </template>
      <template v-else-if="stats">
        <AdminStatCard icon="i-lucide-package" label="Active products" :value="stats.products" />
        <AdminStatCard icon="i-lucide-users" label="Customers" :value="stats.customers" />
        <AdminStatCard icon="i-lucide-receipt" label="Pending orders" :value="stats.pendingOrders" />
        <AdminStatCard icon="i-lucide-message-circle" label="Messages today" :value="stats.messagesToday" />
      </template>
    </div>
  </div>
</template>
