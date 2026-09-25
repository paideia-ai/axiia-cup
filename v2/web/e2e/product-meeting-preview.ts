import type { AgentVersionDTO } from '../src/api/types.ts'
import { navigationVersions } from '../src/testing/version-navigation-fixtures.ts'
import { inventory, scenario } from '../src/testing/v34-fixtures.ts'

// Local fixtures only. No credentials, disk writes, or upstream API calls.
const examples = [
  { id: 101, count: 12, name: '十二版策略' },
  { id: 103, count: 40, name: '四十版策略' },
  { id: 104, count: 4, name: '四版策略' },
  { id: 105, count: 5, name: '五版策略' },
  { id: 106, count: 0, name: '空白策略' },
]
const sessions = new Map<string, {
  versions: Map<number, AgentVersionDTO[]>
  drafts: Map<number, Record<string, string>>
}>()

export async function productMeetingAPI(
  request: Request,
  path: string,
): Promise<Response | null> {
  const cookie = /product-preview=([a-z0-9-]+)/.exec(
    request.headers.get('cookie') ?? '',
  )?.[1]
  const sessionID = cookie ?? crypto.randomUUID()
  if (!sessions.has(sessionID)) {
    sessions.set(sessionID, {
      versions: new Map(
        examples.map((
          { id, count },
        ) => [
          id,
          navigationVersions(count, id).map((v) => ({
            ...v,
            isEntry: id === 101 && v.isEntry,
          })),
        ]),
      ),
      drafts: new Map(
        examples.map((
          { id, count },
        ) => [id, {
          prompt: navigationVersions(count, id).at(-1)?.prompt ?? '',
        }]),
      ),
    })
  }
  const session = sessions.get(sessionID)!
  const json = (value: unknown, status = 200) =>
    Response.json(value, {
      status,
      headers: {
        'Set-Cookie':
          `product-preview=${sessionID}; Path=/; HttpOnly; SameSite=Lax`,
      },
    })
  if (path === '/auth/me') {
    return json({
      account: {
        id: `product-preview-${sessionID}`,
        displayName: '预览用户',
        isAdmin: false,
      },
      elevated: false,
      firstBattleDone: false,
    })
  }
  if (path === '/my/agents') {
    return json({
      scenarios: [{
        ...inventory.scenarios[0],
        sides: {
          a: examples.map(({ id, name }) => {
            const versions = session.versions.get(id)!
            return {
              agentID: id,
              name,
              versionCount: versions.length,
              latestVersionID: versions.at(-1)?.id ?? null,
              entryVersionID: versions.find((v) => v.isEntry)?.id ?? null,
            }
          }),
          b: [],
        },
      }],
    })
  }
  const match =
    /^\/agents\/(\d+)\/(draft|versions|diff|mutate|save|entry\/(\d+)|stream)$/
      .exec(path)
  if (!match) return null
  const id = Number(match[1])
  const versions = session.versions.get(id)
  if (!versions) return null
  const fields = session.drafts.get(id)!
  if (request.method === 'GET') {
    if (match[2] === 'draft') {
      return json({ fields, scenarioID: scenario.summary.id, side: 'a' })
    }
    if (match[2] === 'versions') {
      return json({
        versions,
        entryVersionID: versions.find((v) => v.isEntry)?.id ?? null,
      })
    }
    if (match[2] === 'diff') {
      const params = new URL(request.url).searchParams
      return json({
        base: versions.find((v) => v.id === Number(params.get('base'))),
        head: versions.find((v) => v.id === Number(params.get('head'))),
      })
    }
    if (match[2] === 'stream') {
      return new Response('retry: 60000\n\n', {
        headers: { 'Content-Type': 'text/event-stream' },
      })
    }
  }
  if (request.method === 'POST') {
    if (match[2] === 'mutate') {
      const { field, value } = await request.json()
      fields[field] = value
      return json({ ok: true })
    }
    if (match[3]) {
      const entryID = Number(match[3])
      if (!versions.some((v) => v.id === entryID)) {
        return json({ error: 'not_found' }, 404)
      }
      for (const rows of session.versions.values()) {
        for (const row of rows) row.isEntry = row.id === entryID
      }
      return json({ ok: true })
    }
    if (match[2] === 'save') {
      const input = await request.json()
      const version = {
        ...input,
        id: id * 100 + versions.length + 1,
        agentID: id,
        ordinal: versions.length + 1,
        snapshotSeq: versions.length * 4,
        isEntry: false,
      }
      versions.push(version)
      return json(version)
    }
  }
  return null
}

export const productMeetingLanding =
  `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>版本导航与构建入口预览</title><style>body{background:#0c0c0c;color:#e8e8e8;font:16px/1.8 system-ui;max-width:760px;margin:48px auto;padding:0 24px}h1{font-size:24px}a{color:#e8e8e8;display:block;padding:12px 16px;margin:8px 0;border:1px solid #303030;border-radius:8px;text-decoration:none}a:hover,a:focus{border-color:#e04a2f}p{color:#aaa}</style><h1>版本导航与构建入口</h1><p>本地交互预览 · 模拟数据。草稿、保存和参赛选择只保留在本次预览，不发起真实对战。</p><a href="/agents/101">12 个版本：目录定位、参赛选择、版本对比</a><a href="/agents/103">40 个版本：无滚动条目录，可用滚轮浏览</a><a href="/agents/104">4 个版本：不显示目录</a><a href="/agents/105">5 个版本：开始显示目录</a><a href="/agents/101/build">已有版本构建器：AI 辅助与“…”菜单</a><a href="/agents/106/build">空白普通构建器：同样通过“…”使用预设</a><a href="/matches/9001?express=1">首战战报：保持 main 原有引导</a><a href="/agents/106/build?express=1">首次上手流程：直接展示预设选择</a></html>`
