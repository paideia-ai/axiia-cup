import type {
  AgentVersionDTO,
  ConfigResponse,
  ScenarioDetail,
} from '../../api/types'

export const initialText =
  '你是本能寺之变中的细川藤孝。\n\n先听清对方的承诺，再追问承诺如何兑现。不要急于表态；从家族的安危、盟友的立场与退路开始，判断这场局势。\n\n我希望你'
export const scenario: ScenarioDetail = {
  summary: {
    id: 'honnoji-decision',
    title: '本能寺之变',
    subject: '天正十年，抉择之夜',
    sideAName: '主战派',
    sideBName: '止战派',
    sideALabel: '劝光秀起兵',
    sideBLabel: '劝光秀止兵',
    turnCount: 6,
    gateUnlocked: false,
    gateProgress: { a: { beaten: 0, needed: 1 }, b: { beaten: 0, needed: 1 } },
  },
  stages: [],
  presets: [{
    key: 'chosokabe-standard',
    side: 'a',
    label: '长宗我部密使',
    modelID: 'kimi-k2.6',
    options: JSON.stringify({ role: 'chosokabe' }),
  }],
}
const models = [
  { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  { id: 'kimi-k2.6', label: 'Kimi K2.6' },
]
const config: ConfigResponse = {
  dailyBattleLimit: 12,
  pvpDailyLimit: 4,
  concurrencyLimit: 2,
  pvpUnlockPerSideWins: 1,
  promptUnitLimit: 1000,
  models,
  opponentDailyChallengeLimit: 2,
  trialsBlocked: false,
  usage: { battlesToday: 0, pvpBattlesToday: 0 },
}

// Data is simulated. Both the deployed-page visual capture and the local demo
// use this fixture; writes stay in this tab (sessionStorage), never upstream.
export function createPreviewApi() {
  let prompt = initialText
  let versions: AgentVersionDTO[] = [{
    id: 9001,
    agentID: 101,
    prompt,
    modelID: models[0].id,
    isEntry: true,
    ordinal: 1,
    snapshotSeq: 0,
    options: JSON.stringify({ role: 'hosokawa' }),
  }]
  const storageKey = 'axiia.sound-journey.builder.v1'
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null')
    if (
      typeof saved?.prompt === 'string' && Array.isArray(saved.versions) &&
      saved.versions.length > 0 && saved.versions.every((v: AgentVersionDTO) =>
        v.agentID === 101 && typeof v.prompt === 'string' &&
        typeof v.modelID === 'string' && Number.isSafeInteger(v.id)
      )
    ) {
      prompt = saved.prompt
      versions = saved.versions
    }
  } catch {
    /* Node visual capture and unavailable storage use fresh fixtures. */
  }
  function persist() {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ prompt, versions }))
    } catch { /* In-memory fallback. */ }
  }
  return (path: string, method = 'GET', body: Record<string, unknown> = {}): {
    body: unknown
    status?: number
    stream?: boolean
  } => {
    if (path === '/v1/auth/me') {
      return {
        body: {
          account: {
            id: 'typing-preview',
            displayName: '演示选手',
            isAdmin: false,
            hasTOTP: false,
          },
          elevated: false,
          firstBattleDone: true,
        },
      }
    }
    if (path.endsWith('/stream') || path === '/v1/notifications/bell') {
      return {
        body: path.endsWith('/bell')
          ? 'data: {"unreadCount":0}\n\n'
          : ': preview\n\n',
        stream: true,
      }
    }
    if (path === '/v1/config') return { body: config }
    if (path === '/v1/models') return { body: { models } }
    if (path === '/v1/scenarios') {
      return { body: { scenarios: [scenario.summary] } }
    }
    if (path === '/v1/scenarios/honnoji-decision') return { body: scenario }
    if (path.endsWith('/opponents')) return { body: { opponents: [] } }
    if (path === '/v1/matches') return { body: { matches: [] } }
    if (path === '/v1/notifications') {
      return { body: { unreadCount: 0, notifications: [] } }
    }
    if (path === '/v1/tournaments') return { body: { tournaments: [] } }
    if (path === '/v1/my/agents') {
      return {
        body: {
          scenarios: [{
            scenarioID: scenario.summary.id,
            title: scenario.summary.title,
            sides: {
              a: [],
              b: [{
                agentID: 101,
                name: '先问归路',
                versionCount: versions.length,
                entryVersionID: 9001,
                latestVersionID: versions.at(-1)!.id,
              }],
            },
            gateProgress: scenario.summary.gateProgress,
            entryReady: false,
          }],
        },
      }
    }
    if (path === '/v1/agents/101/draft') {
      return {
        body: {
          fields: { prompt },
          scenarioID: scenario.summary.id,
          side: 'b',
        },
      }
    }
    if (path === '/v1/agents/101/versions') {
      return { body: { versions, entryVersionID: 9001 } }
    }
    if (method === 'POST' && path === '/v1/agents/101/mutate') {
      if (body.field === 'prompt') prompt = String(body.value)
      persist()
      return { body: { ok: true } }
    }
    if (method === 'POST' && path === '/v1/agents/101/save') {
      const version: AgentVersionDTO = {
        id: 9001 + versions.length,
        agentID: 101,
        prompt: String(body.prompt),
        modelID: String(body.modelID),
        isEntry: false,
        ordinal: versions.length + 1,
        snapshotSeq: versions.length,
        options: typeof body.options === 'string' ? body.options : null,
        note: typeof body.note === 'string' ? body.note : null,
      }
      prompt = version.prompt
      versions.push(version)
      persist()
      return { body: version }
    }
    return {
      status: 400,
      body: {
        error: 'preview_only',
        message: '此操作不在输入体验 demo 的范围内。',
      },
    }
  }
}
