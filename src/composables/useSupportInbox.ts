import { computed, ref, watch } from 'vue'
import { demoConversations } from '../data/demoConversations'
import type { Conversation, ConversationStatus, Priority } from '../types/support'

const STORAGE_KEY = 'supportdesk:v2.1'

const initialConversations = () => structuredClone(demoConversations)

const loadConversations = (): Conversation[] => {
  if (typeof window === 'undefined') return initialConversations()
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) as Conversation[] : initialConversations()
  } catch {
    return initialConversations()
  }
}

export const useSupportInbox = () => {
  const conversations = ref<Conversation[]>(loadConversations())
  const selectedId = ref(conversations.value[0]?.id ?? '')
  const search = ref('')
  const filter = ref<'all' | 'priority' | ConversationStatus>('all')

  watch(conversations, (value) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  }, { deep: true })

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
  const pendingCount = computed(() => conversations.value.filter((item) => item.status === 'pending').length)
  const resolvedCount = computed(() => conversations.value.filter((item) => item.status === 'resolved').length)
  const priorityCount = computed(() => conversations.value.filter((item) => item.priority === 'high' && item.status !== 'resolved').length)
  const unreadCount = computed(() => conversations.value.reduce((sum, item) => sum + item.unread, 0))
  const totalMessages = computed(() => conversations.value.reduce((sum, item) => sum + item.messages.length, 0))

  const selectConversation = (id: string) => {
    selectedId.value = id
    const conversation = conversations.value.find((item) => item.id === id)
    if (conversation) conversation.unread = 0
  }

  const appendMessage = (conversation: Conversation, author: 'customer' | 'agent', body: string) => {
    const trimmed = body.trim()
    if (!trimmed) return false

    conversation.messages.push({
      id: crypto.randomUUID(),
      author,
      body: trimmed,
      createdAt: new Date().toISOString(),
    })
    conversation.updatedAt = new Date().toISOString()
    if (conversation.status === 'resolved') conversation.status = 'open'
    return true
  }

  const sendReply = (body: string) => {
    const conversation = selected.value
    if (!conversation) return false
    conversation.unread = 0
    return appendMessage(conversation, 'agent', body)
  }

  const sendCustomerMessage = (conversationId: string, body: string) => {
    const conversation = conversations.value.find((item) => item.id === conversationId)
    if (!conversation) return false
    const sent = appendMessage(conversation, 'customer', body)
    if (sent) conversation.unread += 1
    return sent
  }

  const setStatus = (status: ConversationStatus) => {
    if (selected.value) selected.value.status = status
  }

  const setPriority = (priority: Priority) => {
    if (selected.value) selected.value.priority = priority
  }

  const resetDemo = () => {
    conversations.value = initialConversations()
    selectedId.value = conversations.value[0]?.id ?? ''
    search.value = ''
    filter.value = 'all'
    if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY)
  }

  return {
    conversations,
    selectedId,
    selected,
    search,
    filter,
    filtered,
    openCount,
    pendingCount,
    resolvedCount,
    priorityCount,
    unreadCount,
    totalMessages,
    selectConversation,
    sendReply,
    sendCustomerMessage,
    setStatus,
    setPriority,
    resetDemo,
  }
}
