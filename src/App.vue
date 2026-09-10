<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useSupportInbox } from './composables/useSupportInbox'
import type { ConversationStatus, Priority } from './types/support'

const inbox = useSupportInbox()
const reply = ref('')
const showCustomer = ref(true)
const messageList = ref<HTMLElement | null>(null)

const selected = inbox.selected
const initials = computed(() => selected.value?.customerName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() ?? '')

const formatTime = (iso: string) => new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
const formatDate = (iso: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(iso))
const priorityLabel = (priority: Priority) => priority === 'high' ? 'High priority' : priority === 'low' ? 'Low priority' : 'Normal priority'

const submitReply = async () => {
  if (!inbox.sendReply(reply.value)) return
  reply.value = ''
  await nextTick()
  messageList.value?.scrollTo({ top: messageList.value.scrollHeight, behavior: 'smooth' })
}

const updateStatus = (event: Event) => inbox.setStatus((event.target as HTMLSelectElement).value as ConversationStatus)
</script>

<template>
  <main class="workspace">
    <aside class="rail" aria-label="Primary navigation">
      <a href="#" class="logo" aria-label="SupportDesk home">S</a>
      <nav>
        <button class="rail-button active" aria-label="Inbox">⌁</button>
        <button class="rail-button" aria-label="Customers">◉</button>
        <button class="rail-button" aria-label="Reports">↗</button>
      </nav>
      <div class="agent-avatar" title="Ademola">AA</div>
    </aside>

    <section class="inbox-pane">
      <header class="inbox-header">
        <div>
          <p class="eyebrow">SupportDesk</p>
          <h1>Inbox</h1>
        </div>
        <span class="online-badge"><i></i> Online</span>
      </header>

      <div class="summary-row">
        <div><strong>{{ inbox.openCount.value }}</strong><span>Open</span></div>
        <div><strong>{{ inbox.priorityCount.value }}</strong><span>Priority</span></div>
        <div><strong>{{ inbox.conversations.value.length }}</strong><span>Total</span></div>
      </div>

      <label class="search-box">
        <span>⌕</span>
        <input v-model="inbox.search.value" type="search" placeholder="Search conversations" aria-label="Search conversations" />
      </label>

      <div class="filters" aria-label="Conversation filters">
        <button v-for="option in ['all','priority','open','pending','resolved']" :key="option" :class="{ active: inbox.filter.value === option }" @click="inbox.filter.value = option as typeof inbox.filter.value">
          {{ option }}
        </button>
      </div>

      <div class="conversation-list" aria-live="polite">
        <button
          v-for="conversation in inbox.filtered.value"
          :key="conversation.id"
          class="conversation-card"
          :class="{ selected: inbox.selectedId.value === conversation.id }"
          @click="inbox.selectConversation(conversation.id)"
        >
          <div class="avatar">{{ conversation.customerName.split(' ').map((part) => part[0]).join('').slice(0,2) }}</div>
          <div class="conversation-copy">
            <div class="conversation-topline">
              <strong>{{ conversation.customerName }}</strong>
              <time>{{ formatDate(conversation.updatedAt) }}</time>
            </div>
            <p>{{ conversation.subject }}</p>
            <div class="conversation-meta">
              <span class="priority-dot" :data-priority="conversation.priority">{{ priorityLabel(conversation.priority) }}</span>
              <span v-if="conversation.unread" class="unread">{{ conversation.unread }}</span>
            </div>
          </div>
        </button>

        <div v-if="!inbox.filtered.value.length" class="empty-state">No conversations match this filter.</div>
      </div>
    </section>

    <section v-if="selected" class="conversation-pane">
      <header class="conversation-header">
        <div class="customer-heading">
          <div class="avatar large">{{ initials }}</div>
          <div>
            <div class="name-row"><h2>{{ selected.customerName }}</h2><span class="priority-pill" :data-priority="selected.priority">{{ selected.priority }}</span></div>
            <p>{{ selected.subject }}</p>
          </div>
        </div>
        <div class="conversation-actions">
          <select :value="selected.status" aria-label="Conversation status" @change="updateStatus">
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
          <button class="icon-button" :aria-label="showCustomer ? 'Hide customer details' : 'Show customer details'" @click="showCustomer = !showCustomer">ⓘ</button>
        </div>
      </header>

      <div ref="messageList" class="messages">
        <div class="day-divider"><span>Today</span></div>
        <article v-for="message in selected.messages" :key="message.id" class="message" :class="message.author">
          <div class="message-avatar">{{ message.author === 'agent' ? 'AA' : initials }}</div>
          <div>
            <div class="message-meta"><strong>{{ message.author === 'agent' ? 'You' : selected.customerName }}</strong><time>{{ formatTime(message.createdAt) }}</time></div>
            <p>{{ message.body }}</p>
          </div>
        </article>
      </div>

      <form class="composer" @submit.prevent="submitReply">
        <textarea v-model="reply" maxlength="1200" placeholder="Write a reply…" aria-label="Reply message"></textarea>
        <div class="composer-footer">
          <span>Demo workspace · replies stay in this session</span>
          <button type="submit" :disabled="!reply.trim()">Send reply <span>↗</span></button>
        </div>
      </form>
    </section>

    <aside v-if="selected && showCustomer" class="details-pane">
      <div class="details-profile">
        <div class="avatar xlarge">{{ initials }}</div>
        <h3>{{ selected.customerName }}</h3>
        <p>Customer</p>
      </div>

      <dl class="details-list">
        <div><dt>Email</dt><dd>{{ selected.email }}</dd></div>
        <div><dt>Phone</dt><dd>{{ selected.phone }}</dd></div>
        <div><dt>Assigned to</dt><dd>{{ selected.assignedTo }}</dd></div>
        <div><dt>Status</dt><dd class="capitalize">{{ selected.status }}</dd></div>
        <div><dt>Priority</dt><dd class="capitalize">{{ selected.priority }}</dd></div>
      </dl>

      <section class="context-card">
        <span>Conversation context</span>
        <strong>{{ selected.subject }}</strong>
        <p>{{ selected.messages.length }} messages in this thread</p>
      </section>

      <footer class="details-footer">
        <span>Portfolio demo</span>
        <a href="https://github.com/AdemolaAdedoyin/CS-Messaging-Web-App" target="_blank" rel="noreferrer">View source ↗</a>
      </footer>
    </aside>
  </main>
</template>
