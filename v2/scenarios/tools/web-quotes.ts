// 网页 DA「同源引用」工具（u04-c10 / u04-c13 裁定，2026-08-25）。
//
// A4 内容基线要求场景介绍页公开「裁判 prompt + 摘要」，#51 W2 又把「开场白」
// 并入 EXPAND-1——两者的唯一事实源都在 scenarios/*/script.js 的运行时常量里
// （judgeSystem / diaochanSystem / OPENING_LINE / 裁判模型默认值）。网页端不允许
// 出现会漂移的第二份手抄文案：展示用的 web/src/scenarios/runtime-quotes.json
// 由本工具从脚本原文提取生成（--write），并在 `deno task validate` 里逐字核对
// （无参数＝校验模式）。改了脚本没跑 --write，validate 立刻红。
//
// 明确排除：裁判内心独白（judge OS）的生成提示——#51 规定 judgeOsPrompt 维持
// 不公开；本工具只提取对局中真实喂给裁判/NPC 裁决者的扮演 system prompt 与
// 开场白，OS 心声的字段 hint 不在提取范围内。
import { dirname, fromFileUrl, join } from 'jsr:@std/path@1.0.8'

const root = dirname(dirname(fromFileUrl(import.meta.url)))
const scenariosDir = join(root, 'scenarios')
const quotesPath = join(
  dirname(root),
  'web',
  'src',
  'scenarios',
  'runtime-quotes.json',
)

interface RuntimeQuotes {
  judgeModel?: string
  judgePrompt?: string
  openingLine?: string
}

// 与 validate.ts 的 readMeta 同款：场景脚本顶层只声明常量与函数、不调用任何
// 东西，所以带着被没收的全局量执行一遍顶层，就能拿到指定的绑定。
function extractBindings(
  source: string,
  where: string,
  names: string[],
): Record<string, unknown> {
  const banned = (name: string) => () => {
    throw new Error(`${name} is not available in a scenario script`)
  }
  const DateStub = banned('Date') as unknown as Record<string, unknown>
  DateStub.now = DateStub.parse = DateStub.UTC = banned('Date')
  const MathStub = Object.create(Math) as Math
  Object.defineProperty(MathStub, 'random', { value: banned('Math.random') })
  const picks = names
    .map((name) =>
      `${name}: typeof ${name} === 'undefined' ? undefined : ${name}`
    )
    .join(', ')
  const evaluate = new Function(
    'Math',
    'Date',
    'WeakRef',
    'FinalizationRegistry',
    'performance',
    `${source}\n;return { ${picks} }`,
  )
  try {
    return evaluate(
      MathStub,
      DateStub,
      banned('WeakRef'),
      banned('FinalizationRegistry'),
      undefined,
    ) as Record<string, unknown>
  } catch (error) {
    throw new Error(
      `${where}: evaluating top-level bindings failed: ${
        error instanceof Error ? error.message : error
      }`,
    )
  }
}

function requireString(
  value: unknown,
  where: string,
  what: string,
): string {
  if (typeof value !== 'string' || value === '') {
    throw new Error(`${where}: expected ${what} to be a non-empty string`)
  }
  return value
}

// 裁判/裁决者模型的默认值：`game.params.<param> ?? '<model>'`。表达式在
// main() 内、无法经顶层求值拿到，故按源文本逐字匹配提取。
function modelDefault(source: string, where: string, param: string): string {
  const match = new RegExp(`game\\.params\\.${param} \\?\\? '([^']+)'`).exec(
    source,
  )
  if (!match) {
    throw new Error(
      `${where}: cannot find \`game.params.${param} ?? '<model>'\``,
    )
  }
  return match[1]
}

// 每个场景一条明确的提取规则；新场景落地时必须在这里做一次显式决定，
// 否则 validate 直接红——不允许静默漏公开。
const derive: Record<string, (source: string, where: string) => RuntimeQuotes> =
  {
    // 秦孝公：裁判 system prompt 与开场白都是顶层字符串常量。
    'shangyang-court': (source, where) => {
      const bound = extractBindings(source, where, [
        'OPENING_LINE',
        'judgeSystem',
      ])
      return {
        judgeModel: modelDefault(source, where, 'judgeModel'),
        judgePrompt: requireString(bound.judgeSystem, where, 'judgeSystem'),
        openingLine: requireString(bound.OPENING_LINE, where, 'OPENING_LINE'),
      }
    },
    // 明智光秀：judgeSystem 按入场角色实填——展示用默认入场
    // （DEFAULT_ROLE_A × DEFAULT_ROLE_B）的实填原文，网页侧配注解说明。
    'honnoji-decision': (source, where) => {
      const bound = extractBindings(source, where, [
        'OPENING_LINE',
        'judgeSystem',
        'DEFAULT_ROLE_A',
        'DEFAULT_ROLE_B',
      ])
      if (typeof bound.judgeSystem !== 'function') {
        throw new Error(`${where}: judgeSystem is not a function`)
      }
      const roleA = requireString(bound.DEFAULT_ROLE_A, where, 'DEFAULT_ROLE_A')
      const roleB = requireString(bound.DEFAULT_ROLE_B, where, 'DEFAULT_ROLE_B')
      const judgeSystem = bound.judgeSystem as (a: string, b: string) => unknown
      return {
        judgeModel: modelDefault(source, where, 'judgeModel'),
        judgePrompt: requireString(
          judgeSystem(roleA, roleB),
          where,
          'judgeSystem(DEFAULT_ROLE_A, DEFAULT_ROLE_B)',
        ),
        openingLine: requireString(bound.OPENING_LINE, where, 'OPENING_LINE'),
      }
    },
    // 明理者：judgeSystem(CASES) 就是运行时实际使用的实填。三案没有对双方
    // 统一说出的开场首句——openingLine 缺席，不许网页侧编造。
    'trolley-problem': (source, where) => {
      const bound = extractBindings(source, where, ['judgeSystem', 'CASES'])
      if (typeof bound.judgeSystem !== 'function') {
        throw new Error(`${where}: judgeSystem is not a function`)
      }
      const judgeSystem = bound.judgeSystem as (cases: unknown) => unknown
      return {
        judgeModel: modelDefault(source, where, 'judgeModel'),
        judgePrompt: requireString(
          judgeSystem(bound.CASES),
          where,
          'judgeSystem(CASES)',
        ),
      }
    },
    // 貂蝉身兼场内角色与终局裁决者：她的扮演 system prompt 即「裁判 prompt」。
    // 对峙由【系统】舞台指令开场，无统一开场首句。
    'fengyiting-real': (source, where) => {
      const bound = extractBindings(source, where, ['diaochanSystem'])
      return {
        judgeModel: modelDefault(source, where, 'diaochanModel'),
        judgePrompt: requireString(
          bound.diaochanSystem,
          where,
          'diaochanSystem',
        ),
      }
    },
    // 陪审团投票制（adjudicationMode: jury-vote）：裁决由 11 票合成，没有
    // 单一裁判 prompt；9 名 NPC 陪审员的提示词按 persona 在 main() 内拼装，
    // 不是可提取的顶层常量——该场景在公开引用里显式缺席。
    'legal-harbor-murder-jury': () => ({}),
  }

function scenarioIDs(): string[] {
  const ids: string[] = []
  for (const entry of Deno.readDirSync(scenariosDir)) {
    if (entry.isDirectory) ids.push(entry.name)
  }
  return ids.sort()
}

const expected: Record<string, RuntimeQuotes> = {}
const problems: string[] = []

for (const id of scenarioIDs()) {
  const where = `scenarios/${id}/script.js`
  const rule = derive[id]
  if (!rule) {
    problems.push(
      `${where}: no web-quotes rule — add an explicit entry in ` +
        `tools/web-quotes.ts (even an empty one) so公开范围是一次显式决定`,
    )
    continue
  }
  let source: string
  try {
    source = Deno.readTextFileSync(join(scenariosDir, id, 'script.js'))
  } catch {
    problems.push(`${where}: missing script.js`)
    continue
  }
  try {
    const quotes = rule(source, where)
    // 只序列化实际存在的字段，键序固定，保证 --write 输出稳定。
    const entry: RuntimeQuotes = {}
    if (quotes.judgeModel !== undefined) entry.judgeModel = quotes.judgeModel
    if (quotes.judgePrompt !== undefined) entry.judgePrompt = quotes.judgePrompt
    if (quotes.openingLine !== undefined) entry.openingLine = quotes.openingLine
    if (Object.keys(entry).length > 0) expected[id] = entry
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error))
  }
}

const serialized = JSON.stringify(expected, null, 2) + '\n'

if (problems.length === 0 && Deno.args.includes('--write')) {
  Deno.writeTextFileSync(quotesPath, serialized)
  console.log(`wrote ${quotesPath}`)
} else if (problems.length === 0) {
  let actual: string | null = null
  try {
    actual = Deno.readTextFileSync(quotesPath)
  } catch {
    problems.push(
      `${quotesPath} is missing — run \`deno task web-quotes\` to generate it`,
    )
  }
  if (actual !== null && actual !== serialized) {
    problems.push(
      `${quotesPath} 与脚本原文不一致——网页端引用漂移了。` +
        `跑 \`deno task web-quotes\` 重新生成（勿手改 JSON）`,
    )
  }
}

if (problems.length > 0) {
  console.error('')
  for (const problem of problems) console.error(problem)
  console.error(`\n${problems.length} problem(s)`)
  Deno.exit(1)
}

console.log('web runtime quotes in sync')
