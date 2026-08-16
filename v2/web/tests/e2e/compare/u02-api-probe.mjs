// U02 API 佐证：登录审计账号，检查 /v1/matches 里是否有任何 isMine 参与者，
// 以及 method 校验管道（save 带未知 method 应 400——不产生版本）。
import { request } from 'playwright'

const TARGET = process.env.TARGET ?? 'https://axiia-cup-2-web.isofucius.cn'
const EMAIL = process.env.EMAIL
const sameOrigin = { 'Sec-Fetch-Site': 'same-origin' }

const ctx = await request.newContext({ baseURL: TARGET })
const login = await ctx.post('/v1/auth/login', {
  headers: sameOrigin,
  data: { email: EMAIL, password: 'playwrightpw-123456' },
})
console.log('login:', login.status())

const matches = await (await ctx.get('/v1/matches')).json()
const mine = matches.matches.filter((m) =>
  m.participants?.a?.isMine || m.participants?.b?.isMine
)
console.log(
  'total matches listed:',
  matches.matches.length,
  '| mine:',
  mine.length,
)

const agents = await (await ctx.get('/v1/my/agents')).json()
const shangyang = agents.scenarios.find((s) =>
  s.scenarioID === 'shangyang-court'
)
const agentID = shangyang?.sides?.a?.[0]?.agentID
console.log('agentID:', agentID)

const bad = await ctx.post(`/v1/agents/${agentID}/save`, {
  headers: sameOrigin,
  data: {
    prompt: '仅用于校验管道，不应入库。',
    modelID: 'deepseek-v4-flash',
    method: 'bogus-method',
  },
})
console.log('save with unknown method:', bad.status(), await bad.text())

const versions = await (await ctx.get(`/v1/agents/${agentID}/versions`)).json()
console.log('version count after bad save:', versions.versions.length)
console.log('v1 keys:', Object.keys(versions.versions[0] ?? {}))
await ctx.dispose()
