import { describe, expect, it } from 'vitest'

import {
  assembleDeck,
  type Deck,
  deckComboKey,
  deckComplete,
  initModesAvailable,
} from './deck'

const fragmentDeck: Deck = {
  title: '片段牌',
  role: '甲',
  assembly: {
    perQuestion: '<sectionHeading>：\n<fragment>',
    joiner: '\n\n',
  },
  questions: [
    {
      id: 'q1',
      sectionHeading: '你的身份',
      prompt: '你是谁？',
      options: [
        { id: 'A', label: '改革者', fragment: '你是改革者。' },
        { id: 'B', label: '执行者', fragment: '你是执行者。' },
      ],
    },
    {
      id: 'q2',
      sectionHeading: '你的策略',
      prompt: '你怎么打？',
      options: [
        { id: 'A', label: '证据', fragment: '用证据说话。' },
        { id: 'B', label: '风险', fragment: '比较风险。' },
      ],
    },
  ],
}

const comboDeck: Deck = {
  title: '组合牌',
  role: '乙',
  assembly: { perQuestion: 'combo-mapped (see comboPrompts)', joiner: '\n\n' },
  questions: [
    {
      id: 'q1',
      sectionHeading: '身份',
      prompt: '？',
      options: [{ id: 'A', label: 'a' }, { id: 'B', label: 'b' }],
    },
    {
      id: 'q2',
      sectionHeading: '策略',
      prompt: '？',
      options: [{ id: 'A', label: 'a' }, { id: 'B', label: 'b' }],
    },
  ],
  comboPrompts: {
    'A-A': { 身份: '组合甲甲的身份。', 策略: '组合甲甲的策略。' },
    'A-B': { 身份: '组合甲乙的身份。', 策略: '组合甲乙的策略。' },
  },
}

describe('assembleDeck — fragment deck（W1 逐题拼装）', () => {
  it('assembles heading + fragment per question, joined by blank lines', () => {
    expect(assembleDeck(fragmentDeck, { q1: 'A', q2: 'B' })).toBe(
      '你的身份：\n你是改革者。\n\n你的策略：\n比较风险。',
    )
  })

  it('grows progressively: unanswered questions are skipped in order', () => {
    expect(assembleDeck(fragmentDeck, {})).toBe('')
    expect(assembleDeck(fragmentDeck, { q2: 'A' })).toBe(
      '你的策略：\n用证据说话。',
    )
  })

  it('ignores a selection pointing at a non-existent option', () => {
    expect(assembleDeck(fragmentDeck, { q1: 'Z', q2: 'A' })).toBe(
      '你的策略：\n用证据说话。',
    )
  })

  it('does not interpret $-sequences in fragments as replacement patterns', () => {
    const deck: Deck = {
      ...fragmentDeck,
      questions: [{
        id: 'q1',
        sectionHeading: '标题',
        prompt: '？',
        options: [{ id: 'A', label: 'x', fragment: '价格是 $100，模式 $&。' }],
      }],
    }
    expect(assembleDeck(deck, { q1: 'A' })).toBe(
      '标题：\n价格是 $100，模式 $&。',
    )
  })

  it('normalizes literal \\n leftovers in assembly templates', () => {
    const deck: Deck = {
      ...fragmentDeck,
      assembly: {
        perQuestion: '<sectionHeading>：\\n<fragment>',
        joiner: '\\n\\n',
      },
    }
    expect(assembleDeck(deck, { q1: 'A', q2: 'A' })).toBe(
      '你的身份：\n你是改革者。\n\n你的策略：\n用证据说话。',
    )
  })
})

describe('assembleDeck — combo deck（电车 81 组合查表）', () => {
  it('maps a complete selection to its combo prompt, sectioned like a fragment deck', () => {
    expect(deckComboKey(comboDeck, { q1: 'A', q2: 'B' })).toBe('A-B')
    expect(assembleDeck(comboDeck, { q1: 'A', q2: 'B' })).toBe(
      '身份：\n组合甲乙的身份。\n\n策略：\n组合甲乙的策略。',
    )
  })

  it('yields nothing until every question is answered', () => {
    expect(deckComboKey(comboDeck, { q1: 'A' })).toBeNull()
    expect(assembleDeck(comboDeck, { q1: 'A' })).toBe('')
  })

  it('yields nothing for a combination missing from the table', () => {
    expect(assembleDeck(comboDeck, { q1: 'B', q2: 'B' })).toBe('')
  })
})

describe('deckComplete', () => {
  it('requires every question to hold a real option', () => {
    expect(deckComplete(fragmentDeck, {})).toBe(false)
    expect(deckComplete(fragmentDeck, { q1: 'A' })).toBe(false)
    expect(deckComplete(fragmentDeck, { q1: 'A', q2: 'Z' })).toBe(false)
    expect(deckComplete(fragmentDeck, { q1: 'A', q2: 'B' })).toBe(true)
  })
})

describe('initModesAvailable — E7/#83 初始化-only 门', () => {
  it('offers the three init modes only while the workspace is empty', () => {
    expect(initModesAvailable('', 0)).toBe(true)
    expect(initModesAvailable('  \n\t ', 0)).toBe(true)
  })

  it('any text — assembled or typed — closes the chooser for good', () => {
    expect(initModesAvailable('你是商鞅。', 0)).toBe(false)
    expect(initModesAvailable(' x ', 0)).toBe(false)
  })

  it('a saved version shuts the gate for good — even on an empty workspace', () => {
    // E7/#83（pr-fate u02-c19 拍板 A）：清空工作区不复活三选一；重选初始化
    // 走「再建一个」新智能体（#90 的唯一出口）。
    expect(initModesAvailable('', 1)).toBe(false)
    expect(initModesAvailable('  \n ', 3)).toBe(false)
  })
})
