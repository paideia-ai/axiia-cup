import { describe, expect, it } from 'vitest'

import { retryAfterSeconds, SEND_CODE_COOLDOWN_SECONDS } from './cooldown'

const headers = (value?: string) =>
  new Headers(value == null ? {} : { 'Retry-After': value })

describe('send-code cooldown reads the server budget', () => {
  it.each([
    ['60', 60],
    ['3420', 3420],
    ['1', 1],
  ])('takes Retry-After: %s as %i seconds', (header, seconds) => {
    expect(retryAfterSeconds(headers(header))).toBe(seconds)
  })

  it.each([
    ['absent', undefined],
    ['empty', ''],
    ['zero', '0'],
    ['negative', '-30'],
    ['unparseable', 'soon'],
    ['an HTTP-date', 'Wed, 21 Oct 2026 07:28:00 GMT'],
  ])(
    'reports no budget when Retry-After is %s, so the caller keeps the default',
    (_label, header) => {
      expect(retryAfterSeconds(headers(header))).toBeNull()
    },
  )

  it('keeps a 60 s default for sends the server did not throttle', () => {
    expect(SEND_CODE_COOLDOWN_SECONDS).toBe(60)
  })
})
