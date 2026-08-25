import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { fengyitingReal } from './fengyiting-real'
import { honnojiDecision } from './honnoji-decision'
import { legalHarborMurderJury } from './legal-harbor-murder-jury'
import quotes from './runtime-quotes.json'
import { shangyangCourt } from './shangyang-court'
import { trolleyProblem } from './trolley-problem'

// 同源纪律（u04-c10 / u04-c13 裁定，2026-08-25）：教育层公开的裁判 prompt
// 原文、开场白与裁判模型必须逐字引用 runtime-quotes.json——真值由 v2/scenarios
// 的 `deno task validate`（tools/web-quotes.ts）对照 script.js 把关，前端模块
// 不允许手抄第二份。本文件守住「模块字段 ⇄ JSON」这半程的接线。
describe('runtime quotes wiring', () => {
  it('covers exactly the four extractable scenarios', () => {
    expect(Object.keys(quotes).sort()).toEqual([
      'fengyiting-real',
      'honnoji-decision',
      'shangyang-court',
      'trolley-problem',
    ])
  })

  it('wires Shangyang judge prompt, model and opening line verbatim', () => {
    const education = shangyangCourt.education
    expect(education?.judgePrompt).toBe(quotes['shangyang-court'].judgePrompt)
    expect(education?.judgeModel).toBe(quotes['shangyang-court'].judgeModel)
    expect(education?.openingLine).toBe(quotes['shangyang-court'].openingLine)
  })

  it('wires Honnoji quotes and explains the default-cast instantiation', () => {
    const education = honnojiDecision.education
    expect(education?.judgePrompt).toBe(quotes['honnoji-decision'].judgePrompt)
    expect(education?.judgeModel).toBe(quotes['honnoji-decision'].judgeModel)
    expect(education?.openingLine).toBe(quotes['honnoji-decision'].openingLine)
    // 按局实填的场景必须交代展示口径（默认入场）。
    expect(education?.judgePromptNote).toMatch(/默认入场/)
  })

  it('wires Trolley and Fengyiting prompts; neither invents an opening line', () => {
    expect(trolleyProblem.education?.judgePrompt).toBe(
      quotes['trolley-problem'].judgePrompt,
    )
    expect(trolleyProblem.education?.judgeModel).toBe(
      quotes['trolley-problem'].judgeModel,
    )
    expect(trolleyProblem.education?.openingLine).toBeUndefined()
    expect(fengyitingReal.education?.judgePrompt).toBe(
      quotes['fengyiting-real'].judgePrompt,
    )
    expect(fengyitingReal.education?.judgeModel).toBe(
      quotes['fengyiting-real'].judgeModel,
    )
    expect(fengyitingReal.education?.openingLine).toBeUndefined()
  })

  it('keeps the jury scenario explicitly outside the single-judge quotes', () => {
    // 陪审团投票制：裁决由 11 票合成，无单一裁判 prompt（见 web-quotes.ts）。
    expect(legalHarborMurderJury.education?.judgePrompt).toBeUndefined()
    expect(legalHarborMurderJury.education?.openingLine).toBeUndefined()
  })

  it('matches the Shangyang opening line to the script constant verbatim', () => {
    // 深防线：即使绕过 deno 侧校验，这里也能在 CI 的 vitest 层抓住漂移。
    const script = readFileSync(
      new URL(
        '../../../scenarios/scenarios/shangyang-court/script.js',
        import.meta.url,
      ),
      'utf8',
    )
    expect(script).toContain(
      `const OPENING_LINE = '${quotes['shangyang-court'].openingLine}'`,
    )
  })
})
