<script setup lang="ts">
import type { ChatMessage, Conversation } from '~/types/admin'
import { shallowRef, watch } from 'vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: conversations, status } = useFetch<Conversation[]>('/api/admin/conversations', { lazy: true })

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
    <h1 class="mb-6 text-2xl font-bold">
      Conversations
    </h1>

    <div class="grid items-start gap-4 md:grid-cols-[280px_1fr]">
      <div v-if="status === 'pending'" class="space-y-2">
        <USkeleton v-for="i in 4" :key="i" class="h-14 rounded-lg" />
      </div>

      <UCard v-else :ui="{ body: 'p-0 sm:p-0' }">
        <button
          v-for="conversation in conversations"
          :key="conversation.id"
          type="button"
          class="flex w-full flex-col border-b border-default px-4 py-3 text-left last:border-b-0 hover:bg-elevated/50"
          :class="{ 'bg-primary/10': conversation.id === selectedId }"
          @click="selectedId = conversation.id"
        >
          <span class="font-medium">{{ conversation.name || conversation.waId }}</span>
          <span class="text-xs text-muted">
            {{ conversation.messageCount }} messages
            <template v-if="conversation.lastMessageAt">
              · {{ formatDateTime(conversation.lastMessageAt) }}
            </template>
          </span>
        </button>
        <p v-if="conversations && conversations.length === 0" class="p-4 text-sm text-muted">
          No customers yet.
        </p>
      </UCard>

      <div>
        <p v-if="selectedId === null" class="p-4 text-muted">
          Select a conversation to read it.
        </p>
        <div v-else-if="loadingThread" class="space-y-2">
          <USkeleton class="h-10 w-2/3 rounded-lg" />
          <USkeleton class="ml-auto h-10 w-2/3 rounded-lg" />
          <USkeleton class="h-10 w-1/2 rounded-lg" />
        </div>
        <AdminChatThread v-else :messages="messages" />
      </div>
    </div>
  </div>
</template>
