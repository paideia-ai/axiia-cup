// Input is a private, hash-verified API capture. Only the sanitized output is public.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const source = process.argv[2]
assert.ok(
  source,
  'Usage: node tests/demo/export-public-snapshot.mjs <capture-directory>',
)
const manifest = JSON.parse(
  await readFile(path.join(source, 'manifest.json'), 'utf8'),
)
assert.equal(manifest.phase, 'ready')
const hash = (value) => createHash('sha256').update(value).digest('hex')
const evidence = []
async function get(route) {
  const record = manifest.routes.find((r) => r.route === route)
  assert.ok(record, `Missing captured route: ${route}`)
  const bytes = await readFile(path.join(source, `${hash(route)}.json`))
  assert.equal(hash(bytes), record.sha256, route)
  evidence.push({ route, sha256: record.sha256, capturedAt: record.capturedAt })
  return JSON.parse(bytes)
}
const me = await get('/v1/auth/me')
const names = new Map([[me.account.displayName, '演示选手']])
function alias(name) {
  if (!name) return name
  if (!names.has(name)) names.set(name, `选手 ${names.size}`)
  return names.get(name)
}
function sanitize(value, stripThinking = false) {
  if (Array.isArray(value)) return value.map((v) => sanitize(v, stripThinking))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, v]) => {
        if (
          /^(email|phone|password|token|cookie|session|secret|prompt|options)$/i
            .test(key)
        ) return []
        if (stripThinking && key === 'reasoning') return []
        if (key === 'ownerDisplayName' || key === 'playerName') {
          return [[key, alias(v)]]
        }
        if (key === 'playerID' || key === 'ownerAccountID') {
          return [[key, `demo-${hash(String(v)).slice(0, 12)}`]]
        }
        return [[key, sanitize(v, stripThinking || key === 'turns')]]
      }),
    )
  }
  return value
}
const scenarios = await get('/v1/scenarios')
const inventory = await get('/v1/my/agents')
const scenarioDetails = {}
for (const s of scenarios.scenarios) {
  scenarioDetails[s.id] = await get(`/v1/scenarios/${s.id}?side=a`)
}
const agents = []
for (const s of inventory.scenarios) {
  for (const side of ['a', 'b']) {
    for (const a of s.sides[side]) {
      const draft = await get(`/v1/agents/${a.agentID}/draft`)
      const versions = await get(`/v1/agents/${a.agentID}/versions`)
      const role = side === 'a'
        ? scenarioDetails[s.scenarioID].summary.sideAName
        : scenarioDetails[s.scenarioID].summary.sideBName
      const replacement =
        `【演示替代文本：真实私人策略未公开】\n你是${s.title}中的${role}。先确认公开事实，再说明自己的立场；逐项回应对方的论点，明确区分证据与推测。遵守场景规则，不编造未出现的信息。`
      a.name = a.name ? `示例智能体 ${a.agentID}` : null
      agents.push({
        id: a.agentID,
        name: a.name,
        scenario: s.scenarioID,
        side,
        fields: { prompt: draft.fields.prompt ? replacement : '' },
        versions: versions.versions.map((v) => ({
          ...sanitize(v),
          prompt: v.prompt ? replacement : '',
        })),
      })
    }
  }
}
const matches = []
for (const { route } of manifest.routes) {
  if (/^\/v1\/matches\/\d+$/.test(route)) {
    matches.push(sanitize(await get(route)))
  }
}
matches.sort((a, b) => b.summary.id - a.summary.id)
const allMatches = await get('/v1/matches')
const tournaments = await get('/v1/tournaments')
const standings = {}
for (const t of tournaments.tournaments) {
  standings[t.id] = sanitize(await get(`/v1/tournaments/${t.id}/standings`))
}
const config = await get('/v1/config')
const data = {
  provenance: {
    source: manifest.source,
    capturedAt: manifest.completed,
    description:
      '正式 API 静态快照；账户匿名化；私人策略为标注的示例文本；私有思考轨迹未公开。',
    counts: {
      scenarios: scenarios.scenarios.length,
      agents: agents.length,
      versions: agents.reduce((n, a) => n + a.versions.length, 0),
      capturedMatches: matches.length,
      totalHistoryMatches: allMatches.matches.length,
      tournaments: tournaments.tournaments.length,
    },
    evidence,
  },
  scenarios: scenarios.scenarios,
  scenarioDetails,
  inventory,
  agents,
  matches,
  tournaments: tournaments.tournaments,
  standings,
  config,
}
const serialized = JSON.stringify(data, null, 2) + '\n'
assert.ok(
  !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialized),
  'Email found in export',
)
assert.ok(
  !/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(serialized),
  'JWT found in export',
)
await writeFile(
  new URL('../../src/demo/public-snapshot.json', import.meta.url),
  serialized,
)
console.log(JSON.stringify(data.provenance.counts))
