import {
  type PlaygroundRun,
  type PlaygroundRunStart,
  type PlaygroundRunSummary,
} from '@axiia/shared'
import type { Command } from 'commander'

import { apiFetch } from '../lib/http'
import { parseId } from '../lib/ids'
import { writeCollectionOutput, writeJsonOutput } from '../lib/io'
import {
  normalizePlaygroundRun,
  normalizePlaygroundRunStart,
  normalizePlaygroundRunSummary,
} from '../lib/normalizers'
import { exportPlaygroundRun } from '../lib/local-export'

export function registerPlaygroundCommands(program: Command) {
  program
    .command('playground:run')
    .description('Create a playground run (JSON by default)')
    .argument('<submissionId>', 'submission id')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(async (submissionIdArg: string, options: { output?: string }) => {
      const submissionId = parseId(submissionIdArg)

      if (!submissionId) {
        throw new Error('Invalid submission id')
      }

      const run = await apiFetch<PlaygroundRunStart>(
        '/api/playground/run',
        {
          body: JSON.stringify({ submissionId }),
          method: 'POST',
        },
        true,
      )

      writeJsonOutput(
        {
          kind: 'playground.run_start',
          ...normalizePlaygroundRunStart(submissionId, run),
        },
        options.output,
      )
    })

  program
    .command('playground:list')
    .description('List playground runs for a submission (JSON by default)')
    .argument('<submissionId>', 'submission id')
    .option('--jsonl', 'emit one normalized run JSON object per line')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(
      async (
        submissionIdArg: string,
        options: { jsonl?: boolean; output?: string },
      ) => {
        const submissionId = parseId(submissionIdArg)

        if (!submissionId) {
          throw new Error('Invalid submission id')
        }

        const runs = await apiFetch<PlaygroundRunSummary[]>(
          `/api/playground/runs/${submissionId}`,
          { method: 'GET' },
          true,
        )

        writeCollectionOutput({
          format: options.jsonl ? 'jsonl' : 'json',
          items: runs.map(normalizePlaygroundRunSummary),
          kind: 'playground.runs',
          meta: { submissionId },
          outputPath: options.output,
        })
      },
    )

  program
    .command('playground:get')
    .description('Fetch one playground run (JSON by default)')
    .argument('<submissionId>', 'submission id')
    .argument('<runId>', 'run id')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(
      async (
        submissionIdArg: string,
        runIdArg: string,
        options: { output?: string },
      ) => {
        const submissionId = parseId(submissionIdArg)
        const runId = parseId(runIdArg)

        if (!submissionId) {
          throw new Error('Invalid submission id')
        }

        if (!runId) {
          throw new Error('Invalid run id')
        }

        const run = await apiFetch<PlaygroundRun>(
          `/api/playground/runs/${submissionId}/${runId}`,
          { method: 'GET' },
          true,
        )

        writeJsonOutput(
          {
            kind: 'playground.run',
            run: normalizePlaygroundRun(run),
          },
          options.output,
        )
      },
    )

  program
    .command('playground:interrupt')
    .description('Interrupt one playground run (JSON by default)')
    .argument('<submissionId>', 'submission id')
    .argument('<runId>', 'run id')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(
      async (
        submissionIdArg: string,
        runIdArg: string,
        options: { output?: string },
      ) => {
        const submissionId = parseId(submissionIdArg)
        const runId = parseId(runIdArg)

        if (!submissionId) {
          throw new Error('Invalid submission id')
        }

        if (!runId) {
          throw new Error('Invalid run id')
        }

        const run = await apiFetch<PlaygroundRun>(
          `/api/playground/runs/${submissionId}/${runId}/interrupt`,
          { method: 'POST' },
          true,
        )

        writeJsonOutput(
          {
            kind: 'playground.run_interrupted',
            run: normalizePlaygroundRun(run),
          },
          options.output,
        )
      },
    )

  program
    .command('playground:export')
    .description('Export a local playground run and its llm_calls from SQLite')
    .argument('<runId>', 'playground run id')
    .option('-d, --db <path>', 'SQLite database path')
    .option('-o, --output <path>', 'write JSON to file instead of stdout')
    .action(async (runIdArg: string, options: { db?: string; output?: string }) => {
      const runId = Number.parseInt(runIdArg, 10)

      if (!Number.isInteger(runId) || runId <= 0) {
        throw new Error('runId must be a positive integer')
      }

      exportPlaygroundRun({
        dbPath: options.db,
        outputPath: options.output,
        runId,
      })
    })
}
