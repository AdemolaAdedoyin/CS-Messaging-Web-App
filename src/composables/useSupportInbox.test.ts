import { describe, expect, it } from 'vitest'
import { useSupportInbox } from './useSupportInbox'

describe('useSupportInbox', () => {
  it('prioritizes high-priority conversations', () => {
    const inbox = useSupportInbox()
    expect(inbox.filtered.value[0]?.priority).toBe('high')
  })

  it('filters conversations by search term and status', () => {
    const inbox = useSupportInbox()
    inbox.search.value = 'loan'
    expect(inbox.filtered.value).toHaveLength(1)
    expect(inbox.filtered.value[0]?.customerName).toBe('Daniel Brooks')

    inbox.search.value = ''
    inbox.filter.value = 'resolved'
    expect(inbox.filtered.value.every((item) => item.status === 'resolved')).toBe(true)
  })

  it('marks a conversation read and adds an agent reply', () => {
    const inbox = useSupportInbox()
    const target = inbox.conversations.value.find((item) => item.unread > 0)
    expect(target).toBeTruthy()
    inbox.selectConversation(target!.id)
    expect(target!.unread).toBe(0)

    const before = target!.messages.length
    expect(inbox.sendReply('I am checking this for you.')).toBe(true)
    expect(target!.messages).toHaveLength(before + 1)
    expect(target!.messages.at(-1)?.author).toBe('agent')
  })

  it('adds customer messages and increments unread state', () => {
    const inbox = useSupportInbox()
    const target = inbox.conversations.value[2]!
    const beforeUnread = target.unread
    const beforeMessages = target.messages.length

    expect(inbox.sendCustomerMessage(target.id, 'I have one more question.')).toBe(true)
    expect(target.messages).toHaveLength(beforeMessages + 1)
    expect(target.messages.at(-1)?.author).toBe('customer')
    expect(target.unread).toBe(beforeUnread + 1)
  })

  it('updates priority and exposes queue metrics', () => {
    const inbox = useSupportInbox()
    inbox.selectConversation('conv-3')
    inbox.setPriority('high')

    expect(inbox.selected.value?.priority).toBe('high')
    expect(inbox.openCount.value).toBeGreaterThan(0)
    expect(inbox.totalMessages.value).toBeGreaterThan(0)
    expect(inbox.priorityCount.value).toBeGreaterThan(0)
  })

  it('resets the demo to seeded state', () => {
    const inbox = useSupportInbox()
    inbox.selectConversation('conv-1')
    inbox.setStatus('resolved')
    inbox.resetDemo()

    expect(inbox.conversations.value.find((item) => item.id === 'conv-1')?.status).toBe('open')
    expect(inbox.filter.value).toBe('all')
  })
})
