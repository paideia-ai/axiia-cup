import { describe, expect, it } from 'vitest'
import type { NotificationDTO } from '../api/types'
import { applyNotificationMutations } from './notification-mutations'

const row = (id: number): NotificationDTO => ({
  id,
  read: false,
  kind: 'achievement_unlocked',
  title: '初试锋芒',
})

describe('notification actions while new achievements arrive', () => {
  it('keeps arrivals unread after marking the current list as read', () => {
    const result = applyNotificationMutations([row(1), row(2)], {
      readIDs: new Set([1]),
      clearedIDs: new Set(),
    })
    expect(result.map(({ id, read }) => [id, read])).toEqual([[1, true], [
      2,
      false,
    ]])
  })
  it('keeps arrivals visible after clearing the current list', () => {
    expect(applyNotificationMutations([row(1), row(2)], {
      readIDs: new Set([1]),
      clearedIDs: new Set([1]),
    })).toEqual([row(2)])
  })
})
