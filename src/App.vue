<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useSupportInbox } from './composables/useSupportInbox'
import type { ConversationStatus, Priority } from './types/support'

type DemoMode = 'chooser' | 'agent' | 'customer'
type AgentSection = 'inbox' | 'customers' | 'reports'

const inbox = useSupportInbox()
const mode = ref<DemoMode>('chooser')
const agentSection = ref<AgentSection>('inbox')
const customerConversationId = ref('')
const reply = ref('')
const customerMessage = ref('')
const showCustomer = ref(true)
const messageList = ref<HTMLElement | null>(null)

const selected = inbox.selected
const customerConversation = computed(() => inbox.conversations.value.find((item) => item.id === customerConversationId.value) ?? null)
const initialsFor = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
const initials = computed(() => selected.value ? initialsFor(selected.value.customerName) : '')

const formatTime = (iso: string) => new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
const formatDate = (iso: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(iso))
const priorityLabel = (priority: Priority) => priority === 'high' ? 'High priority' : priority === 'low' ? 'Low priority' : 'Normal priority'

const openAgent = () => {
  mode.value = 'agent'
  agentSection.value = 'inbox'
}

const openCustomerDemo = () => {
  mode.value = 'customer'
  customerConversationId.value = ''
}

const openConversationFromDirectory = (id: string) => {
  inbox.selectConversation(id)
  agentSection.value = 'inbox'
}

const submitReply = async () => {
  if (!inbox.sendReply(reply.value)) return
  reply.value = ''
  await nextTick()
  messageList.value?.scrollTo({ top: messageList.value.scrollHeight, behavior: 'smooth' })
}

const submitCustomerMessage = async () => {
  const conversation = customerConversation.value
  if (!conversation || !inbox.sendCustomerMessage(conversation.id, customerMessage.value)) return
  customerMessage.value = ''
  await nextTick()
  messageList.value?.scrollTo({ top: messageList.value.scrollHeight, behavior: 'smooth' })
}

const updateStatus = (event: Event) => inbox.setStatus((event.target as HTMLSelectElement).value as ConversationStatus)
const updatePriority = (event: Event) => inbox.setPriority((event.target as HTMLSelectElement).value as Priority)
</script>

<template>
  <main v-if="mode === 'chooser'" class="demo-entry">
    <div class="entry-copy">
      <p class="eyebrow">Customer support messaging</p>
      <h1>SupportDesk</h1>
      <p>Explore both sides of a production-style support workflow without creating an account.</p>
    </div>
    <div class="entry-options">
      <button class="entry-card" @click="openAgent">
        <span class="entry-icon">↗</span>
        <strong>Demo as support agent</strong>
        <p>Triage conversations, search the inbox, update statuses, and reply to customers.</p>
        <span class="entry-link">Open agent workspace →</span>
      </button>
      <button class="entry-card customer-entry" @click="openCustomerDemo">
        <span class="entry-icon">◌</span>
        <strong>Demo as customer</strong>
        <p>Choose a customer identity, open a support thread, and send messages into the shared demo model.</p>
        <span class="entry-link">Open customer portal →</span>
      </button>
    </div>
    <footer class="entry-footer">
      <span>Vue 3 · TypeScript · Vite</span>
      <a href="https://github.com/AdemolaAdedoyin/CS-Messaging-Web-App" target="_blank" rel="noreferrer">View source ↗</a>
    </footer>
  </main>

  <main v-else-if="mode === 'customer'" class="customer-portal">
    <header class="portal-header">
      <button class="back-button" @click="mode = 'chooser'; customerConversationId = ''">← Back</button>
      <div><p class="eyebrow">SupportDesk</p><strong>Customer portal</strong></div>
      <span class="online-badge"><i></i> Support online</span>
    </header>

    <section v-if="!customerConversation" class="customer-picker">
      <div class="picker-heading">
        <p class="eyebrow">Choose a demo identity</p>
        <h1>Which customer would you like to be?</h1>
        <p>Each identity opens its own support case. Messages you send will appear in the agent inbox in this browser.</p>
      </div>
      <div class="customer-picker-grid">
        <button v-for="conversation in inbox.conversations.value" :key="conversation.id" class="customer-choice" @click="customerConversationId = conversation.id">
          <span class="avatar large">{{ initialsFor(conversation.customerName) }}</span>
          <span class="choice-copy">
            <strong>{{ conversation.customerName }}</strong>
            <span>{{ conversation.subject }}</span>
            <small>{{ conversation.status }} · {{ priorityLabel(conversation.priority) }}</small>
          </span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>

    <section v-else class="portal-card">
      <div class="portal-intro">
        <span class="avatar xlarge">{{ initialsFor(customerConversation.customerName) }}</span>
        <div>
          <div class="portal-intro-topline">
            <p class="eyebrow">Case #{{ customerConversation.id.replace('conv-', '') }}</p>
            <button class="text-button" @click="customerConversationId = ''">Switch customer</button>
          </div>
          <h1>{{ customerConversation.subject }}</h1>
          <p>Your conversation is assigned to {{ customerConversation.assignedTo }}. Demo changes are shared across both views and saved in this browser.</p>
        </div>
      </div>

      <div ref="messageList" class="portal-messages">
        <article v-for="message in customerConversation.messages" :key="message.id" class="message" :class="message.author">
          <div class="message-avatar">{{ message.author === 'agent' ? 'AA' : initialsFor(customerConversation.customerName) }}</div>
          <div>
            <div class="message-meta"><strong>{{ message.author === 'agent' ? 'Support' : 'You' }}</strong><time>{{ formatTime(message.createdAt) }}</time></div>
            <p>{{ message.body }}</p>
          </div>
        </article>
      </div>

      <form class="composer portal-composer" @submit.prevent="submitCustomerMessage">
        <textarea v-model="customerMessage" maxlength="1200" placeholder="Send a message to support…" aria-label="Customer message"></textarea>
        <div class="composer-footer">
          <span>Status: {{ customerConversation.status }} · {{ customerMessage.length }}/1200</span>
          <button type="submit" :disabled="!customerMessage.trim()">Send message <span>↗</span></button>
        </div>
      </form>
    </section>
  </main>

  <main v-else class="workspace">
    <aside class="rail" aria-label="Primary navigation">
      <button class="logo" aria-label="Return to demo selection" @click="mode = 'chooser'">S</button>
      <nav>
        <button class="rail-button" :class="{ active: agentSection === 'inbox' }" aria-label="Inbox" :aria-current="agentSection === 'inbox' ? 'page' : undefined" title="Inbox" @click="agentSection = 'inbox'">⌁</button>
        <button class="rail-button" :class="{ active: agentSection === 'customers' }" aria-label="Customers" :aria-current="agentSection === 'customers' ? 'page' : undefined" title="Customers" @click="agentSection = 'customers'">◉</button>
        <button class="rail-button" :class="{ active: agentSection === 'reports' }" aria-label="Reports" :aria-current="agentSection === 'reports' ? 'page' : undefined" title="Reports" @click="agentSection = 'reports'">↗</button>
      </nav>
      <div class="agent-avatar" title="Ademola">AA</div>
    </aside>

    <template v-if="agentSection === 'inbox'">
      <section class="inbox-pane">
        <header class="inbox-header">
          <div><p class="eyebrow">SupportDesk</p><h1>Inbox</h1></div>
          <span class="online-badge"><i></i> Online</span>
        </header>
        <div class="summary-row">
          <div><strong>{{ inbox.openCount.value }}</strong><span>Open</span></div>
          <div><strong>{{ inbox.priorityCount.value }}</strong><span>Priority</span></div>
          <div><strong>{{ inbox.unreadCount.value }}</strong><span>Unread</span></div>
        </div>
        <label class="search-box"><span>⌕</span><input v-model="inbox.search.value" type="search" placeholder="Search conversations" aria-label="Search conversations" /></label>
        <div class="filters" aria-label="Conversation filters">
          <button v-for="option in ['all','priority','open','pending','resolved']" :key="option" :class="{ active: inbox.filter.value === option }" @click="inbox.filter.value = option as typeof inbox.filter.value">{{ option }}</button>
        </div>
        <div class="conversation-list" aria-live="polite">
          <button v-for="conversation in inbox.filtered.value" :key="conversation.id" class="conversation-card" :class="{ selected: inbox.selectedId.value === conversation.id }" @click="inbox.selectConversation(conversation.id)">
            <div class="avatar">{{ initialsFor(conversation.customerName) }}</div>
            <div class="conversation-copy">
              <div class="conversation-topline"><strong>{{ conversation.customerName }}</strong><time>{{ formatDate(conversation.updatedAt) }}</time></div>
              <p>{{ conversation.subject }}</p>
              <div class="conversation-meta"><span class="priority-dot" :data-priority="conversation.priority">{{ priorityLabel(conversation.priority) }}</span><span v-if="conversation.unread" class="unread">{{ conversation.unread }}</span></div>
            </div>
          </button>
          <div v-if="!inbox.filtered.value.length" class="empty-state">No conversations match this filter.</div>
        </div>
      </section>

      <section v-if="selected" class="conversation-pane">
        <header class="conversation-header">
          <div class="customer-heading">
            <div class="avatar large">{{ initials }}</div>
            <div><div class="name-row"><h2>{{ selected.customerName }}</h2><span class="priority-pill" :data-priority="selected.priority">{{ selected.priority }}</span></div><p>{{ selected.subject }}</p></div>
          </div>
          <div class="conversation-actions">
            <select :value="selected.status" aria-label="Conversation status" @change="updateStatus"><option value="open">Open</option><option value="pending">Pending</option><option value="resolved">Resolved</option></select>
            <button class="icon-button" :aria-label="showCustomer ? 'Hide customer details' : 'Show customer details'" @click="showCustomer = !showCustomer">ⓘ</button>
          </div>
        </header>
        <div ref="messageList" class="messages">
          <div class="day-divider"><span>Today</span></div>
          <article v-for="message in selected.messages" :key="message.id" class="message" :class="message.author">
            <div class="message-avatar">{{ message.author === 'agent' ? 'AA' : initials }}</div>
            <div><div class="message-meta"><strong>{{ message.author === 'agent' ? 'You' : selected.customerName }}</strong><time>{{ formatTime(message.createdAt) }}</time></div><p>{{ message.body }}</p></div>
          </article>
        </div>
        <form class="composer" @submit.prevent="submitReply">
          <textarea v-model="reply" maxlength="1200" placeholder="Write a reply…" aria-label="Reply message"></textarea>
          <div class="composer-footer"><span>Saved locally · {{ reply.length }}/1200</span><button type="submit" :disabled="!reply.trim()">Send reply <span>↗</span></button></div>
        </form>
      </section>

      <aside v-if="selected && showCustomer" class="details-pane">
        <div class="details-profile"><div class="avatar xlarge">{{ initials }}</div><h3>{{ selected.customerName }}</h3><p>Customer</p></div>
        <dl class="details-list">
          <div><dt>Email</dt><dd>{{ selected.email }}</dd></div>
          <div><dt>Phone</dt><dd>{{ selected.phone }}</dd></div>
          <div><dt>Assigned to</dt><dd>{{ selected.assignedTo }}</dd></div>
          <div><dt>Status</dt><dd class="capitalize">{{ selected.status }}</dd></div>
          <div><dt>Priority</dt><dd><select class="inline-select" :value="selected.priority" aria-label="Conversation priority" @change="updatePriority"><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></dd></div>
        </dl>
        <section class="context-card"><span>Conversation context</span><strong>{{ selected.subject }}</strong><p>{{ selected.messages.length }} messages in this thread</p></section>
        <footer class="details-footer"><button class="text-button" @click="inbox.resetDemo">Reset demo</button><a href="https://github.com/AdemolaAdedoyin/CS-Messaging-Web-App" target="_blank" rel="noreferrer">View source ↗</a></footer>
      </aside>
    </template>

    <section v-else-if="agentSection === 'customers'" class="utility-pane">
      <header class="utility-header">
        <div><p class="eyebrow">Directory</p><h1>Customers</h1><p>Every seeded customer and their current support case.</p></div>
        <button class="secondary-button" @click="inbox.resetDemo">Reset demo</button>
      </header>
      <div class="customer-directory">
        <article v-for="conversation in inbox.conversations.value" :key="conversation.id" class="directory-card">
          <div class="avatar xlarge">{{ initialsFor(conversation.customerName) }}</div>
          <div class="directory-main">
            <div class="directory-title"><h2>{{ conversation.customerName }}</h2><span class="priority-pill" :data-priority="conversation.priority">{{ conversation.priority }}</span></div>
            <p>{{ conversation.email }} · {{ conversation.phone }}</p>
            <strong>{{ conversation.subject }}</strong>
            <span class="directory-meta">{{ conversation.status }} · {{ conversation.messages.length }} messages · assigned to {{ conversation.assignedTo }}</span>
          </div>
          <button class="secondary-button" @click="openConversationFromDirectory(conversation.id)">Open conversation</button>
        </article>
      </div>
    </section>

    <section v-else class="utility-pane reports-pane">
      <header class="utility-header">
        <div><p class="eyebrow">Queue snapshot</p><h1>Reports</h1><p>Live summary metrics derived from the current demo workspace.</p></div>
        <button class="secondary-button" @click="inbox.resetDemo">Reset demo</button>
      </header>
      <div class="report-grid">
        <article class="report-card"><span>Open cases</span><strong>{{ inbox.openCount.value }}</strong><p>Conversations waiting on support.</p></article>
        <article class="report-card"><span>Pending cases</span><strong>{{ inbox.pendingCount.value }}</strong><p>Cases awaiting another step.</p></article>
        <article class="report-card"><span>Resolved</span><strong>{{ inbox.resolvedCount.value }}</strong><p>Cases completed in the demo queue.</p></article>
        <article class="report-card"><span>High priority</span><strong>{{ inbox.priorityCount.value }}</strong><p>Unresolved high-priority conversations.</p></article>
        <article class="report-card"><span>Unread messages</span><strong>{{ inbox.unreadCount.value }}</strong><p>Customer messages not yet opened by the agent.</p></article>
        <article class="report-card"><span>Total messages</span><strong>{{ inbox.totalMessages.value }}</strong><p>Messages across all current support threads.</p></article>
      </div>
      <section class="report-note">
        <p class="eyebrow">Production roadmap</p>
        <h2>What comes next</h2>
        <p>Response-time SLAs, assignment performance, escalation analytics, and historical trends require persistent realtime data and authenticated agents. Those are documented in the README rather than simulated here.</p>
      </section>
    </section>
  </main>
</template>
