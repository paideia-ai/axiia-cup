import { describe, expect, it } from 'vitest'

import { ApiError } from '../api/client'
import type { ConfigResponse } from '../api/types'
import { rejectCopy } from './reject-copy'

const config: ConfigResponse = {
  dailyBattleLimit: 12,
  pvpDailyLimit: 4,
  concurrencyLimit: 2,
  pvpUnlockPerSideWins: 3,
  statsDisplayThreshold: 20,
  promptUnitLimit: 900,
  models: [],
  visibility: { ownerOnly: [] },
  opponentDailyChallengeLimit: 2,
  trialsBlocked: false,
  usage: { battlesToday: 0, pvpBattlesToday: 0 },
}

describe('v3.4 rejection copy contracts', () => {
  it.each([
    ['daily_limit', '今日次数已用完（12/12），明天再来'],
    ['concurrency_limit', '同时进行的对局已达上限（2），等一场结束再来'],
    ['pvp_daily_limit', '今日玩家对战次数已用完（4/4），明天再来'],
    ['trials_blocked', '赛事进行中，试炼暂时关闭——请稍后再来'],
    [
      'gate_locked',
      '玩家约战尚未解锁——每侧各赢 ≥3 场 NPC 练习后解锁；差哪侧就去练哪侧（见按侧进度徽章）',
    ],
    [
      'opponent_gate_locked',
      '对方尚未解锁玩家约战——约战双方都需每侧过 NPC 练习门槛，换个对手或等对方练完',
    ],
    [
      'sibling_gate',
      '需先拥有对侧智能体才能在同侧再建（引导门 #59）',
    ],
    [
      'prompt_too_long',
      '提示词超出上限（按汉字或英文词计，上限 900）——对照输入框右下的计数器删减后再保存',
    ],
  ])('maps %s to stable product copy', (code, copy) => {
    expect(rejectCopy(new ApiError('raw server text', 409, code), config))
      .toBe(copy)
  })

  it('falls back to the server message for unknown errors', () => {
    expect(
      rejectCopy(new ApiError('specific failure', 422, 'new_code'), config),
    )
      .toBe('specific failure')
  })
})
