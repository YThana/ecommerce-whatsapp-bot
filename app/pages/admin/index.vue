<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: stats } = await useFetch('/api/admin/stats')
</script>

<template>
  <div>
    <h1 class="page-title">
      Dashboard
    </h1>
    <div v-if="stats" class="stat-grid">
      <AdminStatCard icon="📦" label="Active products" :value="stats.products" />
      <AdminStatCard icon="👥" label="Customers" :value="stats.customers" />
      <AdminStatCard icon="🧾" label="Pending orders" :value="stats.pendingOrders" />
      <AdminStatCard icon="💬" label="Messages today" :value="stats.messagesToday" />
    </div>
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
</style>
