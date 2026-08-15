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
      // P6a：条文号不该出现在玩家眼前（E9 界面自解释）。侧名由调用方补全时
      // 更好，但这里没有场景上下文——用不带编号的通用说法。
      return '需先有一个对侧智能体，才能在同侧再建第二个——两边都会写才是真本事'
    // #14：计数器只做提示，上限由服务端保存时强制；这句把玩家指回计数器。
    case 'prompt_too_long': {
      const limit = config?.promptUnitLimit ?? PROMPT_UNIT_LIMIT
      return `提示词超出上限（按汉字或英文词计，上限 ${limit}）——对照输入框右下的计数器删减后再保存`
    }
    // ── P3 约战错误码族（#66/#76，mock V20 口吻） ─────────────────────────
    // #66 双侧成对：发起方缺侧。
    case 'both_sides_required':
      return 'PVP 约战需双方双侧齐备——你这边还缺一侧（有版本的智能体），先去创建对侧'
    // #66：对方缺侧（单侧玩家不能被约战）。
    case 'opponent_both_sides_required':
      return 'PVP 约战需双方双侧齐备——对方还没有双侧齐备的智能体，换个对手'
    // #76：同一玩家每日被约战限次，护对方配额不被刷。
    case 'opponent_challenge_limit': {
      const m = config?.opponentDailyChallengeLimit
      return m != null
        ? `对方今日收到的约战已达上限（${m} 次/日），明天再约`
        : '对方今日收到的约战已达上限，明天再约'
    }
    // 版本与场景/执侧不匹配（按 id 约战或阵容选择传错侧）。
    case 'wrong_side':
      return '版本与本场景或所需执侧不符——请检查版本 id（需属于本场景、且执在对应一侧）'
    // P6 命名：智能体名 ≤30 字符，超出由服务端拒绝。
    case 'name_too_long':
      return '名字太长——智能体名最多 30 个字符'
    // 服务端内部错误：这不是玩家能改的东西，只给通用文案。老服务端会把驱动
    // 原文（SQL、表名、约束名）塞进 message，绝不透传给玩家——诊断在服务端
    // 日志里。
    case 'internal':
      return '服务器开小差了，请稍后重试'
    default:
      return messageOf(error, fallback)
  }
}

// 账户自助（settings 页：改昵称 / 改密码）的错误码族。invalid_credentials
// 在这里专指「当前密码」验证失败——登录页不经过这个函数，两处文案互不串扰；
// throttled 来自与登录共用的节流护栏（pwchange:<uid>），错误形状相同。
export function accountRejectCopy(
  error: unknown,
  fallback = '请求失败',
): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'invalid_credentials':
        return '当前密码不正确'
      case 'weak_password':
        return '新密码至少 8 位'
      case 'invalid_display_name':
        return '昵称需为 1–50 个字符'
      case 'throttled':
        return '尝试太频繁，请稍后再试'
    }
  }
  return rejectCopy(error, null, fallback)
}

// 约战上下文的配额文案（#52/Q7 成对语义）：一次约战计 2 场、要么整对要么
// 不发——普通单场文案在这里会误导（「已用完」不准确，是「不足一整对」）。
// 三个配额码换成对版本，其余仍走 rejectCopy。
export function challengeRejectCopy(
  error: unknown,
  config?: ConfigResponse | null,
  fallback = '发起约战失败',
): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'daily_limit': {
        const n = config?.dailyBattleLimit
        return n != null
          ? `今日配额不足一整对——一次约战计 2 场（上限 ${n}/日），明天再来`
          : '今日配额不足一整对——一次约战计 2 场，明天再来'
      }
      case 'pvp_daily_limit': {
        const m = config?.pvpDailyLimit
        return m != null
          ? `PVP 配额不足一整对——一次约战计 2 场（上限 ${m}/日），明天再来`
          : 'PVP 配额不足一整对——一次约战计 2 场，明天再来'
      }
      case 'concurrency_limit': {
        const c = config?.concurrencyLimit
        return c != null
          ? `并发名额不足 2 场（同时进行上限 ${c}），等一场结束再约`
          : '并发名额不足 2 场，等一场结束再约'
      }
    }
  }
  return rejectCopy(error, config, fallback)
}
