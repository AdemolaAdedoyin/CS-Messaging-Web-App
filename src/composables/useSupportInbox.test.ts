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
})
