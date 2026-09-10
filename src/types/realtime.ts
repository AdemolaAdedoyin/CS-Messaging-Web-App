import type { ConversationStatus, Priority } from './support'

export type RealtimeRole = 'customer' | 'agent'

export interface RealtimeProfile {
  uid: string
  displayName: string
  email: string
  role: RealtimeRole
}

export interface RealtimeConversation {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  subject: string
  status: ConversationStatus
  priority: Priority
  assignedAgentId: string | null
  assignedAgentName: string | null
  createdAt: Date
  updatedAt: Date
}

export interface RealtimeMessage {
  id: string
  authorId: string
  authorRole: RealtimeRole
  authorName: string
  body: string
  createdAt: Date
}

export interface NewRealtimeCase {
  customerName: string
  customerEmail: string
  subject: string
  message: string
}
