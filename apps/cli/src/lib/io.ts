import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export type StructuredOutputFormat = 'json' | 'jsonl'

export function shellEscapeSingleQuotes(value: string) {
  return value.replaceAll("'", "'\"'\"'")
}

export function writeJsonOutput(payload: unknown, outputPath?: string) {
  const json = JSON.stringify(payload, null, 2)

  if (!outputPath) {
    console.log(json)
    return
  }

  const resolvedPath = resolve(process.cwd(), outputPath)
  mkdirSync(dirname(resolvedPath), { recursive: true })
  writeFileSync(resolvedPath, `${json}\n`, 'utf-8')
  console.log(resolvedPath)
}

export function writeJsonLinesOutput(items: unknown[], outputPath?: string) {
  const lines = items.map((item) => JSON.stringify(item)).join('\n')

  if (!outputPath) {
    if (lines) {
      process.stdout.write(`${lines}\n`)
    }
    return
  }

  const resolvedPath = resolve(process.cwd(), outputPath)
  mkdirSync(dirname(resolvedPath), { recursive: true })
  writeFileSync(resolvedPath, lines ? `${lines}\n` : '', 'utf-8')
  console.log(resolvedPath)
}

export function writeStructuredOutput(params: {
  format?: StructuredOutputFormat
  items?: unknown[]
  outputPath?: string
  payload: unknown
}) {
  if (params.format === 'jsonl') {
    writeJsonLinesOutput(params.items ?? [], params.outputPath)
    return
  }

  writeJsonOutput(params.payload, params.outputPath)
}

export function writeCollectionOutput<T>(params: {
  format?: StructuredOutputFormat
  items: T[]
  kind: string
  meta?: Record<string, unknown>
  outputPath?: string
}) {
  writeStructuredOutput({
    format: params.format,
    items: params.items,
    outputPath: params.outputPath,
    payload: {
      kind: params.kind,
      count: params.items.length,
      ...(params.meta ?? {}),
      items: params.items,
    },
  })
}

export function readJsonInput(filePath: string) {
  const source =
    filePath === '-'
      ? readFileSync(0, 'utf-8')
      : readFileSync(resolve(process.cwd(), filePath), 'utf-8')

  try {
    return JSON.parse(source) as unknown
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown JSON parse error'
    throw new Error(`Invalid JSON input: ${message}`)
  }
}
