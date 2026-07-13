<script setup lang="ts">
import type { ChatMessage, Conversation } from '~/types/admin'
import { shallowRef, watch } from 'vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: conversations } = await useFetch<Conversation[]>('/api/admin/conversations')

const selectedId = shallowRef<number | null>(null)
const messages = shallowRef<ChatMessage[]>([])
const loadingThread = shallowRef(false)

watch(selectedId, async (id, _prev, onCleanup) => {
  if (id === null) {
    messages.value = []
    return
  }
  let cancelled = false
  onCleanup(() => {
    cancelled = true
  })
  loadingThread.value = true
  try {
    const thread = await $fetch<ChatMessage[]>(`/api/admin/conversations/${id}`)
    if (!cancelled) {
      messages.value = thread
    }
  }
  finally {
    if (!cancelled) {
      loadingThread.value = false
    }
  }
})
</script>

<template>
  <div>
    <h1 class="page-title">
      Conversations
    </h1>
    <div class="conversations-layout">
      <div class="card conversations-list">
        <button
          v-for="conversation in conversations"
          :key="conversation.id"
          type="button"
          class="conversation-row"
          :class="{ 'conversation-row-active': conversation.id === selectedId }"
          @click="selectedId = conversation.id"
        >
          <span class="conversation-name">{{ conversation.name || conversation.waId }}</span>
          <span class="conversation-meta">
            {{ conversation.messageCount }} messages
            <template v-if="conversation.lastMessageAt">
              · {{ formatDateTime(conversation.lastMessageAt) }}
            </template>
          </span>
        </button>
        <p v-if="conversations && conversations.length === 0" class="conversations-empty">
          No customers yet.
        </p>
      </div>

      <div class="conversations-thread">
        <p v-if="selectedId === null" class="conversations-hint">
          Select a conversation to read it.
        </p>
        <p v-else-if="loadingThread" class="conversations-hint">
          Loading…
        </p>
        <AdminChatThread v-else :messages="messages" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.conversations-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1rem;
  align-items: start;
}

.conversations-list {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.conversation-row {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.75rem 1rem;
  border: none;
  border-bottom: 1px solid var(--border);
  background: none;
  text-align: left;
  cursor: pointer;
  font: inherit;
}

.conversation-row:hover {
  background: #f8fafc;
}

.conversation-row-active {
  background: #ecfdf5;
}

.conversation-name {
  font-weight: 600;
}

.conversation-meta {
  color: var(--muted);
  font-size: 0.78rem;
}

.conversations-empty,
.conversations-hint {
  color: var(--muted);
  padding: 1rem;
}

@media (max-width: 860px) {
  .conversations-layout {
    grid-template-columns: 1fr;
  }
}
</style>
