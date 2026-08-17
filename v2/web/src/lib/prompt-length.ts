// #14 逐方字数上限的计数算法：按汉字或英文词计（非 token）。
// 逐字移植自 v3-mock src/mock/config.ts 的 countPromptUnits——P2 服务端会按
// 同一算法强制上限（RFC R6：前后端对同一测试向量逐条一致），改动需两端同步。
// P1 仅提示性展示（x / 1000），不阻断保存。

export const PROMPT_UNIT_LIMIT = 1000

// 汉字每字计 1；连续拉丁字母/数字串（允许撇号/连字符连接）整串计 1。
export function promptLength(text: string): number {
  if (!text) return 0
  // 码位转义而非字面汉字：同一套区间（U+4E00–U+9FFF、U+3400–U+4DBF），语义
  // 逐字节相同，不涉及两端算法同步。字面写法会让这个文件所在的打包产物在没有
  // 声明 charset 的页面里被按 latin1 解码，正则塌成非法区间、整个 bundle 抛
  // SyntaxError 而不只是这一处显示乱码。
  const cjk = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g)?.length ?? 0
  const words = text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0
  return cjk + words
}
