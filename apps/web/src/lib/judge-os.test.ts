import { describe, expect, it } from 'bun:test'

import { getSettledJudgeOsTurns } from './judge-os'

describe('getSettledJudgeOsTurns', () => {
  it('orders successful and failed slots without exposing the final pair', () => {
    expect(
      getSettledJudgeOsTurns(
        [
          { afterTurn: 4, tendency: '商鞅', reason: '第四回合理由' },
          { afterTurn: 10, tendency: '甘龙', reason: '最终回合不应展示' },
        ],
        [2],
        4,
      ),
    ).toEqual([2, 4])
  })

  it('deduplicates corrupt overlapping state defensively', () => {
    expect(
      getSettledJudgeOsTurns(
        [{ afterTurn: 2, tendency: '甘龙', reason: '第二回合理由' }],
        [2],
        1,
      ),
    ).toEqual([2])
  })
})
