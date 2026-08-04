// §C2 配置注册表的 mock 实现。
// 规格要求一切配置走文件 + CLI（#44），前端不硬编码数值——
// 这里集中成一个"配置文件"模块模拟该注册表，真实实现应由后端下发。
// 见 docs/BACKEND_REQUIREMENTS.md「配置下发接口」。

import type { Side } from './types'

export const CONFIG = {
  /** 统计展示门槛（对局数，按 agent 计，#39） */
  statsDisplayThreshold: 20,
  /** 每日对战次数上限（每玩家，只计发起人，#45/#52） */
  dailyBattleLimit: 10,
  /** PVP 解锁门槛：赢过 N 个不同 NPC（#46，参考 2） */
  pvpUnlockDistinctNpcs: 2,
  /** 每场景 PVE-NPC 数量（#28） */
  npcsPerScenario: 2,
  /** 新手预设三元组（场景/执方/对手 NPC，#10；建议商鞅） */
  expressPreset: {
    scenarioId: 'shangyang',
    side: 'A' as Side,
    npcId: 'npc-shangyang-baoshou',
  },
  /** 模型清单（可配置，随版本快照，#13） */
  modelList: [
    { id: 'kimi-k2.5', label: 'Kimi K2.5' },
    { id: 'deepseek-v3.2', label: 'DeepSeek V3.2' },
    { id: 'glm-5', label: 'GLM-5' },
    { id: 'qwen3-max', label: 'Qwen3 Max' },
  ],
  /** 可见性矩阵（大简化 #20）：受限三项，仅所有者可见；其余一律公开 */
  visibility: {
    ownerOnly: ['prompt', 'diff', 'selfOsTrace'] as const,
  },
  /** PVP 友谊赛每日限次（#46，数值后定） */
  pvpDailyLimit: 5,
  /** 并发上限（#46，数值后定） */
  concurrencyLimit: 3,
  /** 逐方字数上限（汉字或英文词计，非 token，#14） */
  promptCharLimit: 1000,
  /** 首战 express 轨道的低轮数（EXP-1 候选手段，mock 用） */
  expressTurns: 6,
}

/** #14：按汉字或英文词计数（非 token）。汉字每字计 1，连续拉丁字母/数字串计 1。 */
export function countPromptUnits(text: string): number {
  if (!text) return 0
  const cjk = text.match(/[一-鿿㐀-䶿]/g)?.length ?? 0
  const words = text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0
  return cjk + words
}
