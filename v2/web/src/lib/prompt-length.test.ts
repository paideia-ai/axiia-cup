import { describe, expect, it } from 'vitest'

import { PROMPT_UNIT_LIMIT, promptLength } from './prompt-length'

describe('v3.4 #14/#17/#57 prompt counting contract', () => {
  it.each([
    ['', 0],
    ['你是一个 helpful agent', 6],
    ["can't state-of-the-art 2026", 3],
    ['标点，空格！do not count。', 7],
    ['你好world-1', 3],
  ])('counts %j as %i CJK characters or Latin words', (text, units) => {
    expect(promptLength(text)).toBe(units)
  })

  it('keeps the UI limit aligned with the server contract', () => {
    expect(PROMPT_UNIT_LIMIT).toBe(1000)
    expect(promptLength('测'.repeat(PROMPT_UNIT_LIMIT))).toBe(1000)
    expect(promptLength(`测${' word'.repeat(PROMPT_UNIT_LIMIT)}`)).toBe(1001)
  })
})
