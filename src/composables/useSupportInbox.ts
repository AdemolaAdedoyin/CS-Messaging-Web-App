import { computed, ref } from 'vue'
import { demoConversations } from '../data/demoConversations'
import type { Conversation, ConversationStatus } from '../types/support'

export const useSupportInbox = () => {
  const conversations = ref<Conversation[]>(structuredClone(demoConversations))
  const selectedId = ref(conversations.value[0]?.id ?? '')
  const search = ref('')
  const filter = ref<'all' | 'priority' | ConversationStatus>('all')

  const filtered = computed(() => {
    const term = search.value.trim().toLowerCase()
    return conversations.value
      .filter((conversation) => {
        if (filter.value === 'priority' && conversation.priority !== 'high') return false
        if (['open', 'pending', 'resolved'].includes(filter.value) && conversation.status !== filter.value) return false
        if (!term) return true
        return [conversation.customerName, conversation.subject, conversation.email]
          .some((value) => value.toLowerCase().includes(term))
      })
      .sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1
        if (b.priority === 'high' && a.priority !== 'high') return 1
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
  })

  const selected = computed(() => conversations.value.find((item) => item.id === selectedId.value) ?? null)
  const openCount = computed(() => conversations.value.filter((item) => item.status === 'open').length)
  const priorityCount = computed(() => conversations.value.filter((item) => item.priority === 'high').length)

  const selectConversation = (id: string) => {
    selectedId.value = id
    const conversation = conversations.value.find((item) => item.id === id)
    if (conversation) conversation.unread = 0
  }

  const sendReply = (body: string) => {
    const trimmed = body.trim()
    const conversation = selected.value
    if (!trimmed || !conversation) return false

    conversation.messages.push({
      id: crypto.randomUUID(),
      author: 'agent',
      body: trimmed,
      createdAt: new Date().toISOString(),
    })
    conversation.updatedAt = new Date().toISOString()
    if (conversation.status === 'resolved') conversation.status = 'open'
    return true
  }

  const setStatus = (status: ConversationStatus) => {
    if (selected.value) selected.value.status = status
  }

  return { conversations, selectedId, selected, search, filter, filtered, openCount, priorityCount, selectConversation, sendReply, setStatus }
}
