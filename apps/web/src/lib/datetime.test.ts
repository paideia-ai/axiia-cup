/// <reference types="bun-types" />

import { describe, expect, it } from 'bun:test'

import { formatTimeAgo, parseTimestampMs } from './datetime'

describe('parseTimestampMs', () => {
  it('treats SQLite CURRENT_TIMESTAMP strings as UTC', () => {
    expect(parseTimestampMs('2026-04-07 09:22:43')).toBe(
      Date.parse('2026-04-07T09:22:43Z'),
    )
  })

  it('keeps ISO timestamps with timezone untouched', () => {
    expect(parseTimestampMs('2026-04-07T09:22:43.000Z')).toBe(
      Date.parse('2026-04-07T09:22:43.000Z'),
    )
  })
})

describe('formatTimeAgo', () => {
  it('computes relative time from normalized UTC timestamps', () => {
    const now = Date.parse('2026-04-07T10:52:43Z')

    expect(formatTimeAgo('2026-04-07 09:22:43', now)).toBe('1小时前')
  })
})
