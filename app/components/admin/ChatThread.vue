<script setup lang="ts">
import type { ChatMessage } from '~/types/admin'

defineProps<{
  messages: ChatMessage[]
}>()
</script>

<template>
  <div class="flex max-h-[70vh] min-h-52 flex-col gap-2 overflow-y-auto rounded-lg bg-elevated/50 p-4">
    <div
      v-for="message in messages"
      :key="message.id"
      class="max-w-[78%] rounded-lg px-3 py-2 shadow-sm"
      :class="message.role === 'user'
        ? 'self-start bg-default'
        : 'self-end bg-primary/15'"
    >
      <p class="whitespace-pre-wrap break-words text-sm">{{ message.content }}</p>
      <time class="mt-1 block text-right text-[0.65rem] text-muted">
        {{ formatDateTime(message.createdAt) }}
      </time>
    </div>
    <p v-if="messages.length === 0" class="m-auto text-sm text-muted">
      No messages in this conversation.
    </p>
  </div>
</template>
