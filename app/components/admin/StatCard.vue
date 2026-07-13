<script setup lang="ts">
defineProps<{
  label: string
  value: number | string
  icon: string
}>()
</script>

<template>
  <div class="card stat-card">
    <span class="stat-icon" aria-hidden="true">{{ icon }}</span>
    <div>
      <p class="stat-value">{{ value }}</p>
      <p class="stat-label">{{ label }}</p>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1.1rem 1.3rem;
}

.stat-icon {
  font-size: 1.6rem;
}

.stat-value {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
}
</style>
