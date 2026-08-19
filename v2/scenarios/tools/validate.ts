import ts from 'npm:typescript@5.9.3'
import { dirname, fromFileUrl, join } from 'jsr:@std/path@1.0.8'

const root = dirname(dirname(fromFileUrl(import.meta.url)))
const scenariosDir = join(root, 'scenarios')
const ambient = join(root, 'types', 'axiia.d.ts')
const contract = join(root, 'types', 'contract.ts')

// Judge OS is optional scenario machinery. If a script opts in, require both
// halves of its source-level contract; behavior remains the scenario's own.
const judgeOSRequiredTogether: [RegExp, string][] = [
  [
    /['"`]judge-aside['"`]/,
    "judge OS beats — push aside beats on channel 'judge-aside' with keys `os-<n>`",
  ],
  [
    /\bos-\$\{|key:\s*['"`]os-/,
    "os-<n> beat keys — record each aside via act(..., { key: `os-<n>`, channel: 'judge-aside' })",
  ],
]

const universallyRequired: [RegExp, string][] = [
  [
    /type:\s*['"`]score['"`]/,
    "a structured score emit — game.emit('…', { type: 'score', … }) with the final ledger",
  ],
]

const confiscated: [RegExp, string][] = [
  [/\bMath\.random\b/, 'Math.random — use `await game.random()`'],
  [/\bnew\s+Date\b|\bDate\.(now|parse|UTC)\b/, 'Date — there is no clock'],
  [/\bnew\s+WeakRef\b/, 'WeakRef — use a plain reference'],
  [
    /\bnew\s+FinalizationRegistry\b/,
    'FinalizationRegistry — clean up explicitly',
  ],
  [/\bperformance\s*\./, 'performance — it is undefined in a scenario'],
]

function compilerOptions(): ts.CompilerOptions {
  const path = join(root, 'tsconfig.check.json')
  const read = ts.readConfigFile(path, ts.sys.readFile)
  if (read.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(read.error.messageText, '\n'),
    )
  }
  const parsed = ts.parseJsonConfigFileContent(
    read.config,
    ts.sys,
    root,
    undefined,
    path,
  )
  if (parsed.errors.length > 0) {
    throw new Error(
      parsed.errors.map((e) =>
        ts.flattenDiagnosticMessageText(e.messageText, '\n')
      ).join('\n'),
    )
  }
  return parsed.options
}

function scenarioIDs(): string[] {
  const ids: string[] = []
  for (const entry of Deno.readDirSync(scenariosDir)) {
    if (entry.isDirectory) ids.push(entry.name)
  }
  return ids.sort()
}

// A faithful-enough stand-in for the server's `<source>;meta` evaluation: the top
// level of a scenario declares data and functions and calls nothing, so running it
// with the same globals confiscated tells us what the catalog would see.
function readMeta(source: string, where: string): Record<string, unknown> {
  const banned = (name: string) => () => {
    throw new Error(`${name} is not available in a scenario script`)
  }
  const DateStub = banned('Date') as unknown as Record<string, unknown>
  DateStub.now = DateStub.parse = DateStub.UTC = banned('Date')
  const MathStub = Object.create(Math) as Math
  Object.defineProperty(MathStub, 'random', { value: banned('Math.random') })
  const evaluate = new Function(
    'Math',
    'Date',
    'WeakRef',
    'FinalizationRegistry',
    'performance',
    `${source}\n;return meta`,
  )
  let value: unknown
  try {
    value = evaluate(
      MathStub,
      DateStub,
      banned('WeakRef'),
      banned('FinalizationRegistry'),
      undefined,
    )
  } catch (error) {
    throw new Error(
      `${where}: evaluating \`meta\` failed: ${
        error instanceof Error ? error.message : error
      }`,
    )
  }
  if (typeof value !== 'object' || value === null) {
    throw new Error(`${where}: a scenario must declare \`const meta = { … }\``)
  }
  return value as Record<string, unknown>
}

const options = compilerOptions()
const problems: string[] = []

for (const id of scenarioIDs()) {
  const script = join(scenariosDir, id, 'script.js')
  let source: string
  try {
    source = Deno.readTextFileSync(script)
  } catch {
    problems.push(`scenarios/${id}: missing script.js`)
    continue
  }

  for (const [pattern, message] of confiscated) {
    if (pattern.test(source)) {
      problems.push(`scenarios/${id}/script.js: uses ${message}`)
    }
  }

  let meta: Record<string, unknown> | null = null
  try {
    meta = readMeta(source, `scenarios/${id}/script.js`)
    if (meta.id !== id) {
      problems.push(
        `scenarios/${id}: meta.id is ${
          JSON.stringify(meta.id)
        }; it must equal the directory name`,
      )
    }
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error))
  }

  const adjudicationMode = meta?.adjudicationMode
  if (
    adjudicationMode !== undefined && adjudicationMode !== 'single-judge' &&
    adjudicationMode !== 'jury-vote'
  ) {
    problems.push(
      `scenarios/${id}/script.js: meta.adjudicationMode must be ` +
        "'single-judge' or 'jury-vote'",
    )
  }

  for (const [pattern, message] of universallyRequired) {
    if (!pattern.test(source)) {
      problems.push(`scenarios/${id}/script.js: missing ${message}`)
    }
  }
  if (judgeOSRequiredTogether.some(([pattern]) => pattern.test(source))) {
    for (const [pattern, message] of judgeOSRequiredTogether) {
      if (!pattern.test(source)) {
        problems.push(`scenarios/${id}/script.js: missing ${message}`)
      }
    }
  }

  const program = ts.createProgram([ambient, script, contract], options)
  for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
    const text = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n  ')
    if (!diagnostic.file || diagnostic.start === undefined) {
      problems.push(`scenarios/${id}: ${text}`)
      continue
    }
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
      diagnostic.start,
    )
    const where = diagnostic.file.fileName.startsWith(root)
      ? diagnostic.file.fileName.slice(root.length + 1)
      : diagnostic.file.fileName
    problems.push(
      `${where}:${line + 1}:${character + 1}: TS${diagnostic.code}: ${text}`,
    )
  }

  console.log(`checked scenarios/${id}/script.js`)
}

if (problems.length > 0) {
  console.error('')
  for (const problem of problems) console.error(problem)
  console.error(`\n${problems.length} problem(s)`)
  Deno.exit(1)
}

console.log('all scenarios valid')
