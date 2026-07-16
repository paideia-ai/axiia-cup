import { describe, expect, it } from 'bun:test'
import { Database } from 'bun:sqlite'

import { shangyangJudgeOsPrompt } from '../shangyang-judge-os-prompt'

const migrationNames = [
  '0000_init.sql',
  '0001_template_driven.sql',
  '0002_model_refresh.sql',
  '0003_preset_opponents.sql',
  '0004_submission_retirement.sql',
  '0005_llm_calls_telemetry.sql',
  '0006_polling_indexes.sql',
  '0007_playground_run_updated_at.sql',
  '0008_playground_analytics_fields.sql',
  '0009_submission_dual_models.sql',
  '0010_scorer_model.sql',
  '0011_tournament_termination.sql',
  '0012_tournament_pairing_mode.sql',
  '0013_tournament_model_override.sql',
  '0014_selectable_role_options.sql',
  '0015_preset_role_options.sql',
] as const

async function applyMigration(database: Database, name: string) {
  const source = await Bun.file(new URL(name, import.meta.url)).text()
  const statements = source
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean)

  database.transaction(() => {
    for (const statement of statements) {
      database.exec(statement)
    }
  })()
}

describe('0016 judge OS migration', () => {
  it('preserves telemetry while adding OS storage, prompt, and phase', async () => {
    const database = new Database(':memory:')

    for (const migrationName of migrationNames) {
      await applyMigration(database, migrationName)
    }

    database.exec(`
      INSERT INTO scenarios (
        id,
        title,
        subject,
        judge_prompt,
        agent_prompt_template,
        examination_question_template,
        role_a_name,
        role_b_name
      ) VALUES (
        'shangyang-court',
        '商鞅变法·朝堂辩法',
        '历史',
        'production persona',
        'agent prompt',
        '',
        '商鞅',
        '甘龙'
      );

      INSERT INTO llm_calls (
        playground_run_id,
        phase,
        side,
        model,
        request_json,
        response_content,
        duration_ms
      ) VALUES (
        99,
        'dialogue',
        'a',
        'glm-5.1',
        '{}',
        'existing response',
        12
      );
    `)

    await applyMigration(database, '0016_judge_os.sql')

    const scenario = database
      .query(
        `SELECT judge_os_prompt AS judgeOsPrompt
         FROM scenarios
         WHERE id = 'shangyang-court'`,
      )
      .get() as { judgeOsPrompt: string }
    const existingCall = database
      .query(
        `SELECT phase, response_content AS responseContent
         FROM llm_calls
         WHERE id = 1`,
      )
      .get()
    const columnsFor = (table: string) =>
      database
        .query(`PRAGMA table_info(${table})`)
        .all()
        .map((column) => (column as { name: string }).name)

    expect(scenario.judgeOsPrompt).toBe(shangyangJudgeOsPrompt)
    expect(existingCall).toEqual({
      phase: 'dialogue',
      responseContent: 'existing response',
    })
    expect(columnsFor('matches')).toContain('judge_os')
    expect(columnsFor('playground_runs')).toContain('judge_os')

    expect(() =>
      database.exec(`
        INSERT INTO llm_calls (
          playground_run_id,
          phase,
          side,
          model,
          request_json,
          duration_ms
        ) VALUES (100, 'judge_os', 'judge', 'glm-5.1', '{}', 8)
      `),
    ).not.toThrow()
    expect(() =>
      database.exec(`
        INSERT INTO llm_calls (
          playground_run_id,
          phase,
          side,
          model,
          request_json,
          duration_ms
        ) VALUES (101, 'unknown', 'judge', 'glm-5.1', '{}', 8)
      `),
    ).toThrow()

    database.close()
  })
})
