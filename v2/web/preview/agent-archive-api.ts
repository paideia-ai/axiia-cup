import {
  config,
  inventory,
  scenario,
  scenarioList,
  versions,
} from '../src/testing/v34-fixtures.ts'

const records = new Map([
  [101, {
    ...inventory.scenarios[0].sides.a[0],
    name: '以民为本',
    isArchived: false,
  }],
  [102, {
    ...inventory.scenarios[0].sides.b[0],
    name: '循序渐进',
    isArchived: false,
  }],
  [103, { agentID: 103, name: '尚未开始', versionCount: 0, isArchived: false }],
  [104, { agentID: 104, name: '旧日草稿', versionCount: 2, isArchived: true }],
])
const side = (id: number) => id === 102 ? 'b' : 'a'
const agentVersions = (id: number) =>
  records.get(id)?.versionCount === 0 ? [] : versions.map((v) => ({
    ...v,
    agentID: id,
    id: id === 101 ? v.id : id * 10 + v.ordinal!,
    modelID: 'glm-5.3',
  }))
const json = (body: unknown, status = 200) => Response.json(body, { status })
const failure = () =>
  json({
    error: 'preview_only',
    message: '此预览仅演示归档、恢复和删除空智能体。',
  }, 400)

Deno.serve({ hostname: '127.0.0.1', port: 8197 }, async (request) => {
  const url = new URL(request.url)
  const path = url.pathname
  if (request.method === 'GET') {
    if (path === '/v1/auth/me') {
      return json({
        account: {
          id: 'archive-preview',
          email: 'preview@example.com',
          displayName: '归档功能预览',
          isAdmin: false,
          hasTOTP: false,
        },
        elevated: false,
        firstBattleDone: true,
      })
    }
    if (path === '/v1/config') return json(config)
    if (path === '/v1/scenarios') return json(scenarioList)
    if (path.startsWith('/v1/scenarios/')) return json(scenario)
    if (path === '/v1/models') return json({ models: config.models })
    if (path === '/v1/notifications') {
      return json({ notifications: [], unreadCount: 0 })
    }
    if (path === '/v1/matches') return json({ matches: [] })
    if (path === '/v1/my/agents') {
      return json({
        scenarios: [{
          ...inventory.scenarios[0],
          sides: {
            a: [...records.values()].filter((a) => side(a.agentID) === 'a'),
            b: [...records.values()].filter((a) => side(a.agentID) === 'b'),
          },
        }],
      })
    }
    if (path === '/v1/my/archived-agents') {
      return json({
        agents: [...records.values()].filter((agent) => agent.isArchived).map((
          agent,
        ) => ({
          agent,
          scenarioID: scenario.summary.id,
          scenarioTitle: scenario.summary.title,
          sideName: side(agent.agentID) === 'a' ? '商鞅' : '甘龙',
        })),
      })
    }
    const match = path.match(/^\/v1\/agents\/(\d+)\/(draft|versions|diff)$/)
    if (match) {
      const id = Number(match[1])
      if (!records.has(id)) {
        return json({ error: 'not_found', message: '智能体不存在' }, 404)
      }
      const list = agentVersions(id)
      if (match[2] === 'draft') {
        return json({
          fields: {},
          scenarioID: scenario.summary.id,
          side: side(id),
        })
      }
      if (match[2] === 'diff') return json({ base: list[0], head: list[1] })
      return json({
        versions: list,
        entryVersionID: records.get(id)?.entryVersionID ?? null,
      })
    }
    return json({ error: 'not_found', message: '预览中未提供此内容' }, 404)
  }
  const match = path.match(/^\/v1\/agents\/(\d+)(\/archive)?$/)
  if (!match) return failure()
  const id = Number(match[1])
  const agent = records.get(id)
  if (!agent) return json({ error: 'not_found', message: '智能体不存在' }, 404)
  if (match[2] && ['PUT', 'DELETE'].includes(request.method)) {
    agent.isArchived = request.method === 'PUT'
    return json({ ok: true })
  }
  if (request.method === 'DELETE' && agent.versionCount === 0) {
    records.delete(id)
    return json({ ok: true })
  }
  if (request.method === 'PATCH') {
    agent.name = (await request.json()).name
    return json({ ok: true })
  }
  return failure()
})
