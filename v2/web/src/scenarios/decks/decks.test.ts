import { describe, expect, it } from 'vitest'

import { assembleDeck, type Deck } from '../../lib/deck'
import { PROMPT_UNIT_LIMIT, promptLength } from '../../lib/prompt-length'
import { scenarioModule } from '../index'
import { allDeckSets } from './index'

// 出货内容完整性：对每套 deck 穷举全部选项组合（全部单选 → 组合数 = 各题
// 选项数之积，当前均为 3^4 = 81），逐一断言拼装产物非空且 ≤1000 单位
// （#14 口径：汉字按字、英文词按词）。combo deck 另验查表 81 组合无缺。

function allSelections(deck: Deck): Record<string, string>[] {
  let combos: Record<string, string>[] = [{}]
  for (const question of deck.questions) {
    combos = combos.flatMap((partial) =>
      question.options.map((option) => ({
        ...partial,
        [question.id]: option.id,
      }))
    )
  }
  return combos
}

describe('shipped MCQ decks (#12/#15 · W1 schema)', () => {
  const sets = allDeckSets()

  it('registers a deck set only for scenarios the SPA has a module for', () => {
    for (const set of sets) {
      const module = scenarioModule(set.slotID)
      expect(module, set.slotID).not.toBeNull()
      // deck 的 key 词汇必须能被构建器解析：侧别，或该场景模块的角色 key。
      const roleKeys = new Set(module!.roles.map((role) => role.key))
      for (const key of Object.keys(set.decks)) {
        expect(
          key === 'a' || key === 'b' || roleKeys.has(key),
          `${set.slotID} deck key ${key}`,
        ).toBe(true)
      }
    }
  })

  for (const set of sets) {
    for (const [key, deck] of Object.entries(set.decks)) {
      it(`${set.slotID}/${key}: every combination assembles non-empty and ≤${PROMPT_UNIT_LIMIT} units`, () => {
        const combos = allSelections(deck)
        expect(combos.length).toBeGreaterThan(0)
        if (deck.comboPrompts != null) {
          // 电车组合牌：81 组合逐一有表可查。
          expect(Object.keys(deck.comboPrompts).length).toBe(combos.length)
        }
        for (const selections of combos) {
          const assembled = assembleDeck(deck, selections)
          expect(assembled.trim().length, JSON.stringify(selections))
            .toBeGreaterThan(0)
          expect(promptLength(assembled), JSON.stringify(selections))
            .toBeLessThanOrEqual(PROMPT_UNIT_LIMIT)
          // 两种形态产物同形：每节标题都要出现在产物里。
          for (const question of deck.questions) {
            expect(assembled).toContain(question.sectionHeading)
          }
        }
      })
    }
  }
})
