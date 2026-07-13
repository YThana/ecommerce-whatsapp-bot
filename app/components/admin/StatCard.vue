<script setup lang="ts">
defineProps<{
  label: string
  value: number | string
  icon: string
}>()
</script>

<template>
  <UCard>
    <div class="flex items-center gap-4">
      <div class="flex size-11 items-center justify-center rounded-lg bg-primary/10">
        <UIcon :name="icon" class="size-5 text-primary" />
      </div>
      <div>
        <p class="text-2xl font-bold leading-tight">{{ value }}</p>
        <p class="text-sm text-muted">{{ label }}</p>
      </div>
    </div>
  </UCard>
</template>
