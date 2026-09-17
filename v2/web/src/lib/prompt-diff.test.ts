import { describe, expect, it } from 'vitest'
import { promptDiff } from './prompt-diff'

describe('promptDiff', () => {
  it('marks only the changed Chinese phrase, preserving shared context', () => {
    expect(promptDiff('先听完，再反驳。', '先听完，再追问。')).toEqual([
      { kind: 'same', text: '先听完，再' },
      { kind: 'removed', text: '反驳' },
      { kind: 'added', text: '追问' },
      { kind: 'same', text: '。' },
    ])
  })
  it('keeps emoji and combining sequences whole', () => {
    expect(promptDiff('a👩🏽‍💻é', 'a👩🏽‍🚀é')).toEqual([
      { kind: 'same', text: 'a' },
      { kind: 'removed', text: '👩🏽‍💻é' },
      { kind: 'added', text: '👩🏽‍🚀é' },
    ])
  })
  it('reconstructs both originals, including empty, repeated, and oversized text', () => {
    for (
      const [before, after] of [
        ['', ''],
        ['', '新策略'],
        ['旧策略', ''],
        ['一样', '一样'],
        ['abcabc', 'acbacb'],
        ['<script>\n  &', '<ins>\n  &'],
        ['甲'.repeat(1500), '乙'.repeat(1500)],
        ['前' + '甲'.repeat(1500) + '后', '前' + '乙'.repeat(1500) + '后'],
      ]
    ) {
      const changes = promptDiff(before, after)
      expect(
        changes.filter((x) => x.kind !== 'added').map((x) => x.text).join(''),
      ).toBe(before)
      expect(
        changes.filter((x) => x.kind !== 'removed').map((x) => x.text).join(''),
      ).toBe(after)
    }
  })
})
