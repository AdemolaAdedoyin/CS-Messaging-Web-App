import type { Conversation } from '../types/support'

export const demoConversations: Conversation[] = [
  {
    id: 'conv-1', customerName: 'Maya Thompson', email: 'maya@example.com', phone: '(713) 555-0142',
    subject: 'Payment reversed after checkout', priority: 'high', status: 'open', unread: 2, assignedTo: 'Ademola', updatedAt: '2026-09-10T21:48:00Z',
    messages: [
      { id: 'm1', author: 'customer', body: 'Hi, my card was charged and then the payment was reversed. Can you help?', createdAt: '2026-09-10T21:31:00Z' },
      { id: 'm2', author: 'agent', body: 'I can help with that. I’m checking the transaction timeline now.', createdAt: '2026-09-10T21:35:00Z' },
      { id: 'm3', author: 'customer', body: 'Thanks. I need to know whether I should try the payment again.', createdAt: '2026-09-10T21:48:00Z' },
    ],
  },
  {
    id: 'conv-2', customerName: 'Daniel Brooks', email: 'daniel@example.com', phone: '(832) 555-0181',
    subject: 'Loan application status', priority: 'high', status: 'pending', unread: 1, assignedTo: 'Ademola', updatedAt: '2026-09-10T20:54:00Z',
    messages: [
      { id: 'm4', author: 'customer', body: 'My loan application has been pending since yesterday. Is anything missing?', createdAt: '2026-09-10T20:50:00Z' },
      { id: 'm5', author: 'agent', body: 'I’m reviewing the verification status and will update you shortly.', createdAt: '2026-09-10T20:54:00Z' },
    ],
  },
  {
    id: 'conv-3', customerName: 'Aisha Reed', email: 'aisha@example.com', phone: '(281) 555-0166',
    subject: 'Update account email', priority: 'normal', status: 'open', unread: 0, assignedTo: 'Ademola', updatedAt: '2026-09-10T19:22:00Z',
    messages: [
      { id: 'm6', author: 'customer', body: 'I need to change the email address on my account.', createdAt: '2026-09-10T19:18:00Z' },
      { id: 'm7', author: 'agent', body: 'Absolutely. I’ve sent the verification step to your current email.', createdAt: '2026-09-10T19:22:00Z' },
    ],
  },
  {
    id: 'conv-4', customerName: 'Marcus Lee', email: 'marcus@example.com', phone: '(346) 555-0129',
    subject: 'Transfer completed', priority: 'low', status: 'resolved', unread: 0, assignedTo: 'Ademola', updatedAt: '2026-09-10T17:40:00Z',
    messages: [
      { id: 'm8', author: 'customer', body: 'The transfer finally arrived. Thanks for the follow-up.', createdAt: '2026-09-10T17:37:00Z' },
      { id: 'm9', author: 'agent', body: 'Glad it’s resolved. I’ll close this conversation for you.', createdAt: '2026-09-10T17:40:00Z' },
    ],
  },
]
