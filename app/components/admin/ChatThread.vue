<script setup lang="ts">
import type { ChatMessage } from '~/types/admin'

defineProps<{
  messages: ChatMessage[]
}>()
</script>

<template>
  <div class="thread">
    <div
      v-for="message in messages"
      :key="message.id"
      class="bubble"
      :class="message.role === 'user' ? 'bubble-user' : 'bubble-bot'"
    >
      <p class="bubble-text">{{ message.content }}</p>
      <time class="bubble-time">{{ formatDateTime(message.createdAt) }}</time>
    </div>
    <p v-if="messages.length === 0" class="thread-empty">
      No messages in this conversation.
    </p>
  </div>
</template>

<style scoped>
.thread {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.1rem;
  background: #e8ede9;
  border-radius: var(--radius);
  min-height: 200px;
  max-height: 70vh;
  overflow-y: auto;
}

.bubble {
  max-width: 78%;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  box-shadow: 0 1px 1px rgb(16 24 40 / 0.08);
}

.bubble-user {
  align-self: flex-start;
  background: #fff;
}

.bubble-bot {
  align-self: flex-end;
  background: #d3f4e3;
}

.bubble-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.92rem;
}

.bubble-time {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.7rem;
  color: var(--muted);
  text-align: right;
}

.thread-empty {
  color: var(--muted);
  text-align: center;
  margin: auto;
}
</style>
