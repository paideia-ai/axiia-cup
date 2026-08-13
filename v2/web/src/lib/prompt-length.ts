// #14 逐方字数上限的计数算法：按汉字或英文词计（非 token）。
// 逐字移植自 v3-mock src/mock/config.ts 的 countPromptUnits——P2 服务端会按
// 同一算法强制上限（RFC R6：前后端对同一测试向量逐条一致），改动需两端同步。
// P1 仅提示性展示（x / 1000），不阻断保存。

export const PROMPT_UNIT_LIMIT = 1000

// 汉字每字计 1；连续拉丁字母/数字串（允许撇号/连字符连接）整串计 1。
export function promptLength(text: string): number {
  if (!text) return 0
  const cjk = text.match(/[一-鿿㐀-䶿]/g)?.length ?? 0
  const words = text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0
  return cjk + words
}
