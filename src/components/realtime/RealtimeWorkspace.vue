<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { isFirebaseConfigured } from '../../firebase/client'
import {
  assignRealtimeConversation,
  createRealtimeCase,
  createRealtimeCustomerAccount,
  markRealtimeConversationRead,
  observeRealtimeProfile,
  sendRealtimeMessage,
  signInRealtimeAgent,
  signInRealtimeCustomer,
  signOutRealtime,
  subscribeRealtimeConversations,
  subscribeRealtimeMessages,
  updateRealtimeConversation,
} from '../../repositories/firebaseSupportRepository'
import type { RealtimeConversation, RealtimeMessage, RealtimeProfile, RealtimeRole } from '../../types/realtime'
import type { ConversationStatus, Priority } from '../../types/support'

type CustomerAuthMode = 'signin' | 'signup'

const emit = defineEmits<{ back: [] }>()

const role = ref<RealtimeRole | null>(null)
const profile = ref<RealtimeProfile | null>(null)
const conversations = ref<RealtimeConversation[]>([])
const selectedId = ref('')
const messages = ref<RealtimeMessage[]>([])
const loading = ref(false)
const messagesLoading = ref(false)
const error = ref('')
const threadError = ref('')

const customerAuthMode = ref<CustomerAuthMode>('signin')
const customerName = ref('')
const customerEmail = ref('')
const customerPassword = ref('')
const subject = ref('')
const openingMessage = ref('')
const reply = ref('')
const agentEmail = ref('')
const agentPassword = ref('')

let unsubscribeAuth: (() => void) | null = null
let unsubscribeConversations: (() => void) | null = null
let unsubscribeMessages: (() => void) | null = null
let subscribedMessageId = ''
let subscribedUserId = ''

const selected = computed(() => conversations.value.find((item) => item.id === selectedId.value) ?? null)
const unassignedCount = computed(() => conversations.value.filter((item) => !item.assignedAgentId && item.status !== 'resolved').length)
const canAgentReply = computed(() => {
  if (!profile.value || profile.value.role !== 'agent' || !selected.value) return true
  return selected.value.assignedAgentId === profile.value.uid
})

const formatTime = (date: Date) => new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date)
const formatDate = (date: Date) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
const unreadFor = (conversation: RealtimeConversation) => profile.value?.role === 'agent'
  ? conversation.agentUnreadCount
  : conversation.customerUnreadCount

const clearConversationSubscription = () => {
  unsubscribeConversations?.()
  unsubscribeConversations = null
}

const clearMessageSubscription = () => {
  unsubscribeMessages?.()
  unsubscribeMessages = null
  subscribedMessageId = ''
  subscribedUserId = ''
}

const clearSubscriptions = () => {
  clearConversationSubscription()
  clearMessageSubscription()
}

const ensureMessageSubscription = (id = selectedId.value) => {
  const uid = profile.value?.uid ?? ''
  if (!id || !uid) {
    clearMessageSubscription()
    messages.value = []
    messagesLoading.value = false
    threadError.value = ''
    return
  }

  if (unsubscribeMessages && subscribedMessageId === id && subscribedUserId === uid) return

  clearMessageSubscription()
  messages.value = []
  messagesLoading.value = true
  threadError.value = ''
  subscribedMessageId = id
  subscribedUserId = uid
  unsubscribeMessages = subscribeRealtimeMessages(id, (next) => {
    messages.value = next
    messagesLoading.value = false
    threadError.value = ''
  }, (reason) => {
    messagesLoading.value = false
    threadError.value = reason.message
  })
}

const markSelectedRead = async () => {
  if (!profile.value || !selected.value) return
  const unreadCount = profile.value.role === 'agent'
    ? selected.value.agentUnreadCount
    : selected.value.customerUnreadCount
  if (!unreadCount) return

  try {
    await markRealtimeConversationRead(selected.value.id, profile.value.role)
  } catch {
    // Read receipts are non-critical. A failed unread-state update should never
    // block an otherwise healthy conversation or surface as a case-creation error.
  }
}

const selectConversation = async (id: string) => {
  error.value = ''
  threadError.value = ''
  selectedId.value = id
  ensureMessageSubscription(id)
  await markSelectedRead()
}

const startNewCase = () => {
  error.value = ''
  threadError.value = ''
  subject.value = ''
  openingMessage.value = ''
  reply.value = ''
  selectedId.value = ''
  ensureMessageSubscription('')
}

const subscribeForProfile = (nextProfile: RealtimeProfile) => {
  clearConversationSubscription()
  unsubscribeConversations = subscribeRealtimeConversations(nextProfile, (next) => {
    conversations.value = next
    if (!next.some((item) => item.id === selectedId.value)) selectedId.value = next[0]?.id ?? ''
    ensureMessageSubscription()
    if (nextProfile.role === 'customer' && selectedId.value) void markSelectedRead()
  }, (reason) => {
    error.value = reason.message
  })
}

watch(selectedId, () => ensureMessageSubscription())
watch(() => profile.value?.uid, () => ensureMessageSubscription())

onMounted(() => {
  if (!isFirebaseConfigured) return
  unsubscribeAuth = observeRealtimeProfile((restored) => {
    profile.value = restored
    if (restored) {
      role.value = restored.role
      subscribeForProfile(restored)
    }
  }, (reason) => {
    error.value = reason.message
  })
})

onUnmounted(() => {
  unsubscribeAuth?.()
  clearSubscriptions()
})

const chooseRole = (nextRole: RealtimeRole) => {
  role.value = nextRole
  error.value = ''
  threadError.value = ''
}

const startCustomerSession = async () => {
  if (!customerEmail.value.trim() || !customerPassword.value) return
  if (customerAuthMode.value === 'signup' && !customerName.value.trim()) return

  loading.value = true
  error.value = ''
  try {
    const nextProfile = customerAuthMode.value === 'signup'
      ? await createRealtimeCustomerAccount(customerName.value, customerEmail.value, customerPassword.value)
      : await signInRealtimeCustomer(customerEmail.value, customerPassword.value)

    profile.value = nextProfile
    subscribeForProfile(nextProfile)
    customerPassword.value = ''
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Unable to open the customer account.'
  } finally {
    loading.value = false
  }
}

const createCase = async () => {
  if (!profile.value || !subject.value.trim() || !openingMessage.value.trim()) return
  loading.value = true
  error.value = ''
  threadError.value = ''
  try {
    const caseId = await createRealtimeCase(profile.value, {
      customerName: profile.value.displayName,
      customerEmail: profile.value.email,
      subject: subject.value,
      message: openingMessage.value,
    })
    selectedId.value = caseId
    ensureMessageSubscription(caseId)
    subject.value = ''
    openingMessage.value = ''
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Unable to create the support case.'
  } finally {
    loading.value = false
  }
}

const loginAgent = async () => {
  if (!agentEmail.value.trim() || !agentPassword.value) return
  loading.value = true
  error.value = ''
  try {
    const nextProfile = await signInRealtimeAgent(agentEmail.value, agentPassword.value)
    profile.value = nextProfile
    subscribeForProfile(nextProfile)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Unable to sign in.'
  } finally {
    loading.value = false
  }
}

const send = async () => {
  if (!profile.value || !selected.value || !reply.value.trim()) return
  if (profile.value.role === 'agent' && !canAgentReply.value) {
    error.value = 'Assign this case to yourself before sending a reply.'
    return
  }

  const body = reply.value
  reply.value = ''
  error.value = ''
  threadError.value = ''
  try {
    await sendRealtimeMessage(selected.value.id, profile.value, body)
  } catch (reason) {
    reply.value = body
    error.value = reason instanceof Error ? reason.message : 'Unable to send the message.'
  }
}

const assignToMe = async () => {
  if (!profile.value || profile.value.role !== 'agent' || !selected.value) return
  error.value = ''
  try {
    await assignRealtimeConversation(selected.value.id, profile.value)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Unable to assign this case.'
  }
}

const setStatus = async (event: Event) => {
  if (!selected.value) return
  await updateRealtimeConversation(selected.value.id, { status: (event.target as HTMLSelectElement).value as ConversationStatus })
}

const setPriority = async (event: Event) => {
  if (!selected.value) return
  await updateRealtimeConversation(selected.value.id, { priority: (event.target as HTMLSelectElement).value as Priority })
}

const leaveSession = async () => {
  clearSubscriptions()
  await signOutRealtime()
  profile.value = null
  conversations.value = []
  selectedId.value = ''
  messages.value = []
  role.value = null
  error.value = ''
  threadError.value = ''
}
</script>

<template>
  <main class="realtime-shell">
    <header class="realtime-topbar">
      <button class="realtime-back" @click="profile ? leaveSession() : role ? role = null : emit('back')">
        ← {{ profile ? 'Sign out' : role ? 'Roles' : 'Back' }}
      </button>
      <div>
        <p class="realtime-kicker">SupportDesk Live</p>
        <strong>Realtime workspace</strong>
      </div>
      <span class="realtime-status" :class="{ online: isFirebaseConfigured }">
        <i></i>{{ isFirebaseConfigured ? 'Firebase connected' : 'Setup required' }}
      </span>
    </header>

    <section v-if="!isFirebaseConfigured" class="realtime-setup-card">
      <p class="realtime-kicker">Realtime mode</p>
      <h1>Ready for Firebase configuration.</h1>
      <p>The realtime code and security rules are included, while the existing portfolio demo remains available without external services.</p>
      <div class="setup-steps">
        <span>1</span><p>Create/configure the Firebase project and enable Firestore and Email/Password Auth.</p>
        <span>2</span><p>Add the <code>VITE_FIREBASE_*</code> values from <code>.env.example</code> to Vercel.</p>
        <span>3</span><p>Deploy <code>firestore.rules</code> and provision one agent profile.</p>
      </div>
      <button class="realtime-primary" @click="emit('back')">Return to portfolio demo</button>
    </section>

    <section v-else-if="!role" class="realtime-role-picker">
      <div class="realtime-hero">
        <p class="realtime-kicker">Two browsers. One queue.</p>
        <h1>Choose your live role.</h1>
        <p>Open Customer in one browser and Agent in another. Firestore keeps both sides synchronized in real time.</p>
      </div>
      <div class="realtime-role-grid">
        <button @click="chooseRole('customer')"><span>01</span><strong>Customer</strong><p>Create a real support case and receive replies live.</p></button>
        <button @click="chooseRole('agent')"><span>02</span><strong>Support agent</strong><p>Watch the shared queue, assign work, and reply in real time.</p></button>
      </div>
    </section>

    <section v-else-if="role === 'customer' && !profile" class="realtime-auth-card">
      <p class="realtime-kicker">Customer account</p>
      <h1>{{ customerAuthMode === 'signin' ? 'Welcome back.' : 'Create your support account.' }}</h1>
      <p>{{ customerAuthMode === 'signin' ? 'Sign in to restore your support cases and continue existing conversations.' : 'Create an account once, then return from any browser using the same email and password.' }}</p>
      <form @submit.prevent="startCustomerSession">
        <label v-if="customerAuthMode === 'signup'">Name<input v-model="customerName" autocomplete="name" required placeholder="e.g. Maya Thompson" /></label>
        <label>Email<input v-model="customerEmail" type="email" autocomplete="email" required placeholder="maya@example.com" /></label>
        <label>Password<input v-model="customerPassword" type="password" :autocomplete="customerAuthMode === 'signin' ? 'current-password' : 'new-password'" minlength="6" required /></label>
        <p v-if="error" class="realtime-error">{{ error }}</p>
        <button class="realtime-primary" :disabled="loading">{{ loading ? 'Please wait…' : customerAuthMode === 'signin' ? 'Sign in' : 'Create customer account' }}</button>
        <button type="button" class="realtime-secondary" @click="customerAuthMode = customerAuthMode === 'signin' ? 'signup' : 'signin'; error = ''">
          {{ customerAuthMode === 'signin' ? 'New customer? Create an account' : 'Already have an account? Sign in' }}
        </button>
      </form>
    </section>

    <section v-else-if="role === 'agent' && !profile" class="realtime-auth-card">
      <p class="realtime-kicker">Agent sign in</p>
      <h1>Open the live support queue.</h1>
      <p>Agent accounts must be provisioned in Firebase. There is intentionally no public agent-signup path.</p>
      <form @submit.prevent="loginAgent">
        <label>Email<input v-model="agentEmail" type="email" autocomplete="username" required /></label>
        <label>Password<input v-model="agentPassword" type="password" autocomplete="current-password" required /></label>
        <p v-if="error" class="realtime-error">{{ error }}</p>
        <button class="realtime-primary" :disabled="loading">{{ loading ? 'Signing in…' : 'Sign in as agent' }}</button>
      </form>
    </section>

    <section v-else-if="profile?.role === 'customer'" class="live-customer-layout">
      <aside class="live-customer-list">
        <div class="live-section-heading"><div><p class="realtime-kicker">Signed in as</p><h2>{{ profile.displayName }}</h2></div><span>{{ conversations.length }} cases</span></div>
        <button v-for="conversation in conversations" :key="conversation.id" :class="{ active: conversation.id === selectedId }" @click="selectConversation(conversation.id)">
          <strong>{{ conversation.subject }}</strong>
          <span>{{ conversation.status }} · {{ formatDate(conversation.updatedAt) }}</span>
          <b v-if="unreadFor(conversation)" class="live-unread">{{ unreadFor(conversation) }}</b>
        </button>
        <button class="new-case-button" @click="startNewCase">＋ New support case</button>
      </aside>

      <section v-if="!selected" class="new-case-panel">
        <p class="realtime-kicker">New case</p>
        <h1>How can support help?</h1>
        <form @submit.prevent="createCase">
          <label>Subject<input v-model="subject" maxlength="100" required placeholder="Briefly describe the issue" /></label>
          <label>Message<textarea v-model="openingMessage" maxlength="1200" required placeholder="Tell us what happened…"></textarea></label>
          <p v-if="error" class="realtime-error">{{ error }}</p>
          <button class="realtime-primary" :disabled="loading">{{ loading ? 'Creating…' : 'Create support case' }}</button>
        </form>
      </section>

      <section v-else class="live-thread">
        <header><div><p class="realtime-kicker">{{ selected.status }}</p><h1>{{ selected.subject }}</h1><p>{{ selected.assignedAgentName ? `Assigned to ${selected.assignedAgentName}` : 'Waiting for an agent to claim this case' }}</p></div></header>
        <div class="live-messages">
          <article v-for="message in messages" :key="message.id" :class="message.authorRole">
            <div class="live-avatar">{{ initials(message.authorName) }}</div>
            <div><div class="live-message-meta"><strong>{{ message.authorRole === 'customer' ? 'You' : message.authorName }}</strong><time>{{ formatTime(message.createdAt) }}</time></div><p>{{ message.body }}</p></div>
          </article>
          <p v-if="messagesLoading" class="live-empty">Loading conversation messages…</p>
          <p v-else-if="!messages.length" class="live-empty">No messages in this conversation yet.</p>
          <p v-if="threadError" class="realtime-error live-thread-error">{{ threadError }}</p>
          <p v-if="error" class="realtime-error live-thread-error">{{ error }}</p>
        </div>
        <form class="live-composer" @submit.prevent="send">
          <textarea v-model="reply" maxlength="1200" aria-label="Live customer message" placeholder="Send a message to support…"></textarea>
          <div><span>{{ reply.length }}/1200</span><button class="realtime-primary" :disabled="!reply.trim()">Send message</button></div>
        </form>
      </section>
    </section>

    <section v-else-if="profile?.role === 'agent'" class="live-agent-layout">
      <aside class="live-agent-list">
        <div class="live-section-heading"><div><p class="realtime-kicker">Live queue</p><h2>Inbox</h2></div><span>{{ unassignedCount }} unassigned</span></div>
        <button v-for="conversation in conversations" :key="conversation.id" :class="{ active: conversation.id === selectedId }" @click="selectConversation(conversation.id)">
          <div><strong>{{ conversation.customerName }}</strong><time>{{ formatDate(conversation.updatedAt) }}</time></div>
          <p>{{ conversation.subject }}</p>
          <span>{{ conversation.priority }} · {{ conversation.assignedAgentName ?? 'Unassigned' }}</span>
          <b v-if="conversation.agentUnreadCount" class="live-unread">{{ conversation.agentUnreadCount }}</b>
        </button>
        <p v-if="!conversations.length" class="live-empty">Waiting for the first customer case…</p>
      </aside>

      <section v-if="selected" class="live-thread agent-thread">
        <header>
          <div><p class="realtime-kicker">{{ selected.customerName }}</p><h1>{{ selected.subject }}</h1><p>{{ selected.customerEmail }}</p></div>
          <div class="live-controls">
            <button v-if="!selected.assignedAgentId" class="realtime-secondary" @click="assignToMe">Assign to me</button>
            <select :value="selected.priority" aria-label="Live conversation priority" @change="setPriority"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select>
            <select :value="selected.status" aria-label="Live conversation status" @change="setStatus"><option value="open">Open</option><option value="pending">Pending</option><option value="resolved">Resolved</option></select>
          </div>
        </header>
        <div class="live-assignment">{{ selected.assignedAgentName ? `Assigned to ${selected.assignedAgentName}` : 'Unassigned case — assign it to yourself before replying' }}</div>
        <div class="live-messages">
          <article v-for="message in messages" :key="message.id" :class="message.authorRole">
            <div class="live-avatar">{{ initials(message.authorName) }}</div>
            <div><div class="live-message-meta"><strong>{{ message.authorRole === 'agent' && message.authorId === profile.uid ? 'You' : message.authorName }}</strong><time>{{ formatTime(message.createdAt) }}</time></div><p>{{ message.body }}</p></div>
          </article>
          <p v-if="messagesLoading" class="live-empty">Loading conversation messages…</p>
          <p v-else-if="!messages.length" class="live-empty">No messages in this conversation yet.</p>
          <p v-if="threadError" class="realtime-error live-thread-error">{{ threadError }}</p>
          <p v-if="error" class="realtime-error live-thread-error">{{ error }}</p>
        </div>
        <form class="live-composer" @submit.prevent="send">
          <textarea v-model="reply" maxlength="1200" aria-label="Live agent reply" :disabled="!canAgentReply" :placeholder="canAgentReply ? 'Write a live reply…' : 'Assign this case to yourself before replying'"></textarea>
          <div><span>{{ reply.length }}/1200</span><button class="realtime-primary" :disabled="!reply.trim() || !canAgentReply">Send reply</button></div>
        </form>
      </section>

      <section v-else class="live-empty-panel"><p class="realtime-kicker">Realtime inbox</p><h1>Waiting for a conversation.</h1><p>Open the customer role in another browser and create a case. It will appear here without refreshing.</p></section>
    </section>
  </main>
</template>
