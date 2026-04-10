import { type AdminScenario } from '@axiia/shared'
import type { Command } from 'commander'

import { apiFetch, fetchAdminScenarioById, fetchAdminScenarios } from '../lib/http'
import { readJsonInput, writeCollectionOutput, writeJsonOutput } from '../lib/io'
import { normalizeScenarioSummary } from '../lib/normalizers'
import { parseScenarioUpdateInput } from '../scenario-update'

export function registerScenarioCommands(program: Command) {
  program
    .command('scenarios')
    .description('List scenarios (JSON by default)')
    .option('--jsonl', 'emit one normalized scenario JSON object per line')
    .option('-o, --output <path>', 'write output to file instead of stdout')
    .action(async (options: { jsonl?: boolean; output?: string }) => {
      const scenarios = await fetchAdminScenarios()

      writeCollectionOutput({
        format: options.jsonl ? 'jsonl' : 'json',
        items: scenarios.map(normalizeScenarioSummary),
        kind: 'admin.scenarios',
        outputPath: options.output,
      })
    })

  program
    .command('scenario:get')
    .description('Fetch one scenario as JSON')
    .argument('<scenarioId>', 'scenario id')
    .option('-o, --output <path>', 'write JSON to file instead of stdout')
    .action(async (scenarioId: string, options: { output?: string }) => {
      const scenario = await fetchAdminScenarioById(scenarioId)
      writeJsonOutput(
        {
          kind: 'admin.scenario',
          scenario,
        },
        options.output,
      )
    })

  program
    .command('scenario:update')
    .description('Update a scenario from a file or stdin (JSON by default)')
    .argument('<scenarioId>', 'scenario id')
    .requiredOption(
      '-f, --file <path>',
      'JSON file to read, or "-" to read from stdin',
    )
    .option('-o, --output <path>', 'write JSON to file instead of stdout')
    .action(
      async (
        scenarioId: string,
        options: { file: string; output?: string },
      ) => {
        const scenario = await fetchAdminScenarioById(scenarioId)

        if (scenario.locked) {
          throw new Error('Scenario is locked while a tournament is running')
        }

        const edited = parseScenarioUpdateInput(readJsonInput(options.file))

        const updated = await apiFetch<AdminScenario>(
          `/api/admin/scenarios/${encodeURIComponent(scenarioId)}`,
          {
            method: 'PUT',
            body: JSON.stringify(edited),
          },
          true,
        )

        writeJsonOutput(
          {
            kind: 'admin.scenario_updated',
            scenario: updated,
          },
          options.output,
        )
      },
    )
}
