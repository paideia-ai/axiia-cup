// P2 拒绝文案的唯一落点（#52/#46/#47/#14，mock S14/S32）：服务端在派发/保存
// 上新增的错误码族在这里统一映射成产品文案——数字尽量从 GET /v1/config 填
// （#39 不写死前端），config 缺席（接口失败/老服务器）时降级为无数字版本；
// 未知错误码回落到服务端 message。

import { ApiError } from '../api/client'
import type { ConfigResponse } from '../api/types'
import { PROMPT_UNIT_LIMIT } from './prompt-length'
import { messageOf } from './use-async'

export function rejectCopy(
  error: unknown,
  config?: ConfigResponse | null,
  fallback = '请求失败',
): string {
  if (!(error instanceof ApiError)) return messageOf(error, fallback)
  switch (error.code) {
    // #52 触顶行为已定：按钮可点 → 点击后给这句 → 不入队。
    case 'daily_limit': {
      const n = config?.dailyBattleLimit
      return n != null
        ? `今日次数已用完（${n}/${n}），明天再来`
        : '今日次数已用完，明天再来'
    }
    case 'concurrency_limit': {
      const n = config?.concurrencyLimit
      return n != null
        ? `同时进行的对局已达上限（${n}），等一场结束再来`
        : '同时进行的对局已达上限，等一场结束再来'
    }
    case 'pvp_daily_limit': {
      const m = config?.pvpDailyLimit
      return m != null
        ? `今日玩家对战次数已用完（${m}/${m}），明天再来`
        : '今日玩家对战次数已用完，明天再来'
    }
    // #47 规格行为：赛事运行期间可阻挡全部试炼，不是 bug。
    case 'trials_blocked':
      return '赛事进行中，试炼暂时关闭——请稍后再来'
    // #65/#77 按侧门槛：文案指向面板里的按侧进度徽章。
    case 'gate_locked': {
      const n = config?.pvpUnlockPerSideWins
      return n != null
        ? `玩家约战尚未解锁——每侧各赢 ≥${n} 场 NPC 练习后解锁；差哪侧就去练哪侧（见按侧进度徽章）`
        : '玩家约战尚未解锁——两侧都需先赢下 NPC 练习；差哪侧就去练哪侧（见按侧进度徽章）'
    }
    case 'opponent_gate_locked':
      return '对方尚未解锁玩家约战——约战双方都需每侧过 NPC 练习门槛，换个对手或等对方练完'
    // #59/#79 引导门：同侧第 2 个智能体之前必须先拥有对侧；E4「复制为新
    // 智能体」同受此门。
    case 'sibling_gate':
      return '需先拥有对侧智能体才能在同侧再建（引导门 #59）'
    // #14：计数器只做提示，上限由服务端保存时强制；这句把玩家指回计数器。
    case 'prompt_too_long': {
      const limit = config?.promptUnitLimit ?? PROMPT_UNIT_LIMIT
      return `提示词超出上限（按汉字或英文词计，上限 ${limit}）——对照输入框右下的计数器删减后再保存`
    }
    default:
      return messageOf(error, fallback)
  }
}
