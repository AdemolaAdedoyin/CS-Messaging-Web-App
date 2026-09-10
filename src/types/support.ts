export type Priority = 'high' | 'normal' | 'low'
export type ConversationStatus = 'open' | 'pending' | 'resolved'

export interface Message {
  id: string
  author: 'customer' | 'agent'
  body: string
  createdAt: string
}

export interface Conversation {
  id: string
  customerName: string
  email: string
  phone: string
  subject: string
  priority: Priority
  status: ConversationStatus
  unread: number
  assignedTo: string
  messages: Message[]
  updatedAt: string
}
