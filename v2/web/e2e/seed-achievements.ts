import { adminSession, Session } from './http.ts'

const [baseURL, adminEmail, adminPassword, totpSecret] = Deno.args
if (
  !baseURL || !['127.0.0.1', 'localhost'].includes(new URL(baseURL).hostname)
) throw new Error('This seeder only runs against a local isolated server')
const admin = await adminSession(baseURL, adminEmail, adminPassword, totpSecret)
const code = 'ACHIEVEMENT-PREVIEW'
const password = 'achievement-preview-2026'
await admin.call('POST', '/v1/admin/registration-codes', { code, uses: 100 })
const scenarios = [
  'shangyang-court',
  'honnoji-decision',
  'fengyiting-real',
  'trolley-problem',
  'legal-harbor-murder-jury',
]
for (const id of scenarios) {
  const original = await Deno.readTextFile(
    new URL(`../../scenarios/scenarios/${id}/script.js`, import.meta.url),
  )
  const source =
    original.replace('async function main()', 'async function originalMain()') +
    `
async function main() {
  const own = game.playerPrompt('a') || '';
  const winner = own.includes('预览败局') || (!own.includes('以理服人') && game.playerPrompt('b').includes('以理服人')) ? 'b' : 'a';
  game.emit('main', {type:'scene', text:'本地成就验收：这是一场不调用模型的确定性对局。'});
  game.emit('verdict', {type:'verdict', actor:'judge', judgment:'变法', rulings:{A:'一人侧',B:'一人侧',C:'一人侧'}, requests:{SR1:'同意',SR2:'不同意',SR3:'不同意'}});
  game.emit('verdict', {type:'score', trueRequests:{a:'SR1',b:'GR1'},guesses:{a:'GR1',b:'SR2'}, scoreA:winner === 'a' ? 3 : 0,scoreB:winner === 'b' ? 3 : 0,winner});
  return {winner,scoreA:winner === 'a' ? 3 : 0,scoreB:winner === 'b' ? 3 : 0,reasoning:'本地确定性对局；授予、通知、领取和存储均由真实服务端执行。'};
}
`
  const { sha } = await admin.call<{ sha: string }>(
    'POST',
    '/v1/admin/scripts',
    { source },
  )
  await admin.call('PATCH', `/v1/admin/slots/${id}`, {
    scriptSHA: sha,
    params: {},
  })
}
const config = await admin.call<{ models: { id: string }[] }>(
  'GET',
  '/v1/config',
)
const modelID = config.models[0].id
const players = [
  {
    email: 'achievements@axiia.test',
    displayName: '成就预览',
    prompt: '以理服人。',
  },
  {
    email: 'opponent@axiia.test',
    displayName: '对手',
    prompt: '请开始你的论证。',
  },
  { email: 'fresh@axiia.test', displayName: '初来乍到', prompt: '以理服人。' },
]
const seeded = []
const sessions: Session[] = []
for (const player of players) {
  const session = new Session(baseURL)
  await session.call('POST', '/v1/auth/signup', {
    code,
    password,
    email: player.email,
    displayName: player.displayName,
  })
  const versions: Record<string, number> = {}
  for (const scenarioID of scenarios) {
    for (const side of ['a', 'b']) {
      const { agentID } = await session.call<{ agentID: number }>(
        'POST',
        '/v1/agents/ensure',
        {
          scenarioID,
          side,
          ...(scenarioID === 'honnoji-decision'
            ? { roleKey: side === 'a' ? 'chosokabe' : 'hosokawa_fujitaka' }
            : {}),
        },
      )
      const version = await session.call<{ id: number }>(
        'POST',
        `/v1/agents/${agentID}/save`,
        { prompt: player.prompt, modelID, parentVersionID: null },
      )
      versions[`${scenarioID}:${side}`] = version.id
    }
  }
  seeded.push({ email: player.email, versions })
  sessions.push(session)
}
const showcase = sessions[0]
for (const scenarioID of scenarios) {
  const challenge = await showcase.call<{ matchIDs: number[] }>(
    'POST',
    '/v1/challenges',
    {
      scenarioID,
      mine: { a: { versionID: seeded[0].versions[`${scenarioID}:a`] } },
      opponent: { pinnedVersionID: seeded[1].versions[`${scenarioID}:b`] },
    },
  )
  for (const matchID of challenge.matchIDs) {
    let finished = false
    for (let attempt = 0; attempt < 200; attempt++) {
      const match = await showcase.call<
        { summary: { finished: boolean; error?: string } }
      >('GET', `/v1/matches/${matchID}`)
      if (match.summary.finished) {
        if (match.summary.error) throw new Error(match.summary.error)
        await showcase.call('POST', `/v1/rewards/matches/${matchID}/claim`)
        finished = true
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    if (!finished) throw new Error(`Preview match ${matchID} did not finish`)
  }
}
await Deno.writeTextFile(
  new URL('../.achievement-preview-accounts.json', import.meta.url),
  JSON.stringify({ password, players: seeded }, null, 2),
)
console.log(
  JSON.stringify({
    password,
    players: seeded.map(({ email }) => email),
    registrationCode: code,
  }),
)
