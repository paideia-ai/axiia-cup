import { expect } from '@playwright/test'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { adminContext, baseURL, sameOrigin } from './helpers'

export const a3Dialogue = [
  '首战固定局：商鞅提出按军功授爵，以实绩检验变法。',
  '首战固定局：甘龙追问宗室安置与推行次序。',
]

export async function a3DatabaseCounts() {
  expect(process.env.AXIIA_E2E_ISOLATED).toBe('1')
  const path = process.env.AXIIA_DB_PATH
  expect(path).toMatch(/^\/tmp\//)
  const { stdout } = await promisify(execFile)('python3', [
    '-c',
    `
import json,sqlite3,sys
c=sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True)
tables=['agent_versions','matches','dispatches','journal','turns']
print(json.dumps({table:c.execute('select count(*) from '+table).fetchone()[0] for table in tables}))
c.close()
`,
    path!,
  ])
  return JSON.parse(stdout) as Record<
    'agent_versions' | 'matches' | 'dispatches' | 'journal' | 'turns',
    number
  >
}

export async function installA3OfflineFixture() {
  expect(process.env.AXIIA_E2E_ISOLATED).toBe('1')
  expect(baseURL).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/)
  const admin = await adminContext()
  const slotsResponse = await admin.get('/v1/admin/slots')
  expect(slotsResponse.ok()).toBe(true)
  const slots = await slotsResponse.json() as {
    slots: { id: string; scriptSHA: string; params: unknown }[]
  }
  const original = slots.slots.find((slot) => slot.id === 'shangyang-court')
  expect(original).toBeDefined()
  const scriptResponse = await admin.get(
    `/v1/admin/scripts/${original!.scriptSHA}`,
  )
  expect(scriptResponse.ok()).toBe(true)
  const { source } = await scriptResponse.json() as { source: string }
  expect(source.match(/async function main\(\)/g)).toHaveLength(1)
  // Keep the actual catalog/MCQ metadata; only this isolated slot's execution
  // is replaced. Random journal effects are local entropy, never model calls;
  // their values are discarded so the outcome is deterministic.
  const fixture = source.replace(
    'async function main()',
    'async function unusedProductionMain()',
  ) + `
async function main() {
  game.emit('court', { type: 'scene', actor: 'a', text: ${
    JSON.stringify(a3Dialogue[0])
  } });
  await game.random();
  game.emit('court', { type: 'scene', actor: 'b', text: ${
    JSON.stringify(a3Dialogue[1])
  } });
  for (let step = 0; step < 128; step++) await game.random();
  return { winner: 'a', scoreA: 1, scoreB: 0, reasoning: '首战固定局：商鞅的明确实施方案胜出。' };
}
`
  try {
    const upload = await admin.post('/v1/admin/scripts', {
      headers: sameOrigin,
      data: { source: fixture },
    })
    expect(upload.ok()).toBe(true)
    const { sha } = await upload.json() as { sha: string }
    const repoint = await admin.patch('/v1/admin/slots/shangyang-court', {
      headers: sameOrigin,
      data: { scriptSHA: sha },
    })
    expect(repoint.ok()).toBe(true)
    return {
      scriptSHA: sha,
      async restore() {
        try {
          const response = await admin.patch(
            '/v1/admin/slots/shangyang-court',
            {
              headers: sameOrigin,
              data: {
                scriptSHA: original!.scriptSHA,
                params: original!.params,
              },
            },
          )
          expect(response.ok(), 'isolated slot restored after A3 test').toBe(
            true,
          )
        } finally {
          await admin.dispose()
        }
      },
    }
  } catch (error) {
    await admin.dispose()
    throw error
  }
}
