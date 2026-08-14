// 结构化 act 的标签是引擎自己向模型索要的输出格式（buildActInstruction），不是
// 台词：同一次生成会落成两行——解析后的 verdict（心声/裁决卡）和带标签的原始
// 回复（时间线行）。玩家该看到的只有标签之前的叙述，以及真实推演轨迹。
//
// 只按索引扫描，绝不用场景作者写的字段名去拼 RegExp。

// 标签名的合法形状：ASCII 标识符。不合形状的字段名直接跳过——不解释、不匹配。
const ACT_TAG_NAME = /^[A-Za-z][A-Za-z0-9_.:-]{0,31}$/

// 流式阶段没有配对的 verdict 可依，只能按形状剥：成对的 <ident>…</ident>。
const BALANCED_TAG = /<([A-Za-z][A-Za-z0-9_.:-]{0,31})>[\s\S]*?<\/\1>/g
// 尚未闭合的开标签（或恰好停在串尾的裸 `<`）：从它截到串尾，半个标签不闪出来。
// `<` 后既不是标识符也不是串尾（正文里的 `3<5`）不算开标签。
const OPEN_TAIL = /<(?:\/?[A-Za-z][A-Za-z0-9_.:-]{0,31}[\s\S]*|$)/

function tidy(text: string): string {
  return text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

// verdict 声明的标签名＝它 output JSON 的键；output 不是对象就没有可剥的名字。
export function actTagNames(output: string): string[] {
  let payload: unknown = null
  try {
    payload = JSON.parse(output)
  } catch {
    return []
  }
  if (
    payload == null || typeof payload !== 'object' || Array.isArray(payload)
  ) {
    return []
  }
  return Object.keys(payload as Record<string, unknown>)
}

// 只剥配对 verdict 声明过的标签，其余尖括号原样留下。开标签没有收尾的（生成被
// 截断）连同其后内容一并截掉。
export function stripActTags(
  text: string,
  names: readonly string[],
): string {
  let out = text
  for (const name of names) {
    if (!ACT_TAG_NAME.test(name)) continue
    const open = `<${name}>`
    const close = `</${name}>`
    for (;;) {
      const start = out.indexOf(open)
      if (start < 0) break
      const end = out.indexOf(close, start + open.length)
      if (end < 0) {
        out = out.slice(0, start)
        break
      }
      out = out.slice(0, start) + out.slice(end + close.length)
    }
  }
  return tidy(out)
}

// 流式变体：in-flight 气泡还没有 verdict，按形状剥成对标签、再截掉未闭合的开
// 标签。这里过剥是暂态的——落定后的行走 stripActTags，只认 verdict 声明的名字。
export function stripStreamingActTags(text: string): string {
  return tidy(text.replace(BALANCED_TAG, '').replace(OPEN_TAIL, ''))
}
