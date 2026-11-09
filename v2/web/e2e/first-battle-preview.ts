import type {
  AccountDTO,
  AgentVersionDTO,
  MatchDetail,
  MatchEventDTO,
  NotificationDTO,
  NPCProfileResponse,
  Side,
} from '../src/api/types.ts'
import {
  config,
  expressScoring,
  finishedMatch,
  scenario,
} from '../src/testing/v34-fixtures.ts'

// Exercise the real frontend against local HTTP contracts. Registration, points,
// and authored match playback stay in memory; no SMS, provider, or live API runs.
const INVITE = 'LOCAL-PREVIEW'
const SMS_CODE = '123456'
const COOKIE = 'first-battle-preview'
const TURN_MS = 900
const sessions = new Map<string, PreviewSession>()

interface PreviewAgent {
  side: Side
  name: string | null
  fields: Record<string, string>
  versions: AgentVersionDTO[]
}

interface PreviewMatch {
  detail: MatchDetail
  startedAt: number
  completed: boolean
  claimed: boolean
}

interface PreviewSession {
  account: AccountDTO | null
  signedIn: boolean
  pendingPhone: string | null
  agents: Map<number, PreviewAgent>
  matches: Map<number, PreviewMatch>
  presetScenarioIDs: Set<string>
  notifications: NotificationDTO[]
  balance: number
}

function sessionFor(request: Request) {
  const id = new RegExp(`${COOKIE}=([a-z0-9-]+)`).exec(
    request.headers.get('cookie') ?? '',
  )?.[1] ?? crypto.randomUUID()
  if (!sessions.has(id)) {
    sessions.set(id, {
      account: null,
      signedIn: false,
      pendingPhone: null,
      agents: new Map(),
      matches: new Map(),
      presetScenarioIDs: new Set(),
      notifications: [],
      balance: 1000,
    })
  }
  return { id, session: sessions.get(id)! }
}

export function firstBattlePreviewCookie(request: Request) {
  const { id } = sessionFor(request)
  return `${COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax`
}

function snapshot(session: PreviewSession, match: PreviewMatch): MatchDetail {
  const count = Math.min(
    match.detail.turns.length,
    Math.floor((Date.now() - match.startedAt) / TURN_MS),
  )
  const finished = count === match.detail.turns.length
  if (finished && !match.completed) {
    match.completed = true
    session.notifications.unshift({
      id: match.detail.summary.id,
      kind: 'battle_finished',
      matchID: match.detail.summary.id,
      read: false,
      title: '对战结束',
      body: '商鞅变法·朝堂辩法的对战已结束，查看战报。',
      link: `/matches/${match.detail.summary.id}`,
    })
  }
  const detail = structuredClone(match.detail)
  detail.turns = detail.turns.slice(0, count)
  detail.currentTurn = count
  detail.verdicts = detail.verdicts.filter((verdict) =>
    verdict.afterSeq < count
  )
  detail.summary.finished = finished
  detail.summary.scored = finished
  detail.summary.finishedAt = finished
    ? Math.floor((match.startedAt + match.detail.turns.length * TURN_MS) / 1000)
    : null
  if (!finished) {
    detail.summary.winner = null
    detail.scoreA = null
    detail.scoreB = null
    detail.reasoning = null
  }
  return detail
}

function progress(session: PreviewSession) {
  const beaten = (side: Side) =>
    new Set(
      [...session.matches.values()].map((match) => snapshot(session, match))
        .filter((detail) =>
          detail.summary.finished && detail.summary.winner === side &&
          detail.summary.participants?.[side].isMine
        ).map((detail) =>
          detail.summary.participants?.[side === 'a' ? 'b' : 'a'].presetKey
        ),
    ).size
  return {
    a: { beaten: beaten('a'), needed: 1 },
    b: { beaten: beaten('b'), needed: 1 },
  }
}

function scenarioFor(session: PreviewSession) {
  const gateProgress = progress(session)
  return {
    ...scenario,
    summary: {
      ...scenario.summary,
      title: '商鞅变法·朝堂辩法',
      subject: '历史',
      turnCount: 5,
      gateProgress,
      gateUnlocked: gateProgress.a.beaten > 0 && gateProgress.b.beaten > 0,
    },
    scoring: expressScoring,
  }
}

function stream(
  request: Request,
  emit: (send: (event: unknown) => void) => boolean,
) {
  const encoder = new TextEncoder()
  let timer: ReturnType<typeof setInterval> | undefined
  let cleanup = () => {}
  let closed = false
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const close = () => {
        if (closed) return
        cleanup()
        controller.close()
      }
      cleanup = () => {
        closed = true
        clearInterval(timer)
        request.signal.removeEventListener('abort', close)
      }
      request.signal.addEventListener('abort', close, { once: true })
      timer = setInterval(() => {
        if (closed) return
        if (
          emit((event) =>
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
            )
          )
        ) close()
      }, 300)
      controller.enqueue(encoder.encode(': local preview\n\n'))
    },
    cancel() {
      cleanup()
    },
  })
  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}

export async function firstBattlePreviewAPI(request: Request, path: string) {
  const { id, session } = sessionFor(request)
  const method = request.method
  const url = new URL(request.url)
  const json = (value: unknown, status = 200) =>
    Response.json(value, {
      status,
      headers: {
        'Set-Cookie': `${COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax`,
      },
    })
  const error = (code: string, message: string, status = 400) =>
    json({ error: code, message }, status)
  const me = () => ({
    account: session.account,
    elevated: false,
    firstBattleDone: [...session.matches.values()].some((match) =>
      snapshot(session, match).summary.finished
    ),
  })
  const signup = (displayName: string, email?: string, phone?: string) => {
    session.account = {
      id,
      displayName,
      email,
      phone,
      isAdmin: false,
      hasTOTP: false,
    }
    session.signedIn = true
    return json(me())
  }

  if (path === '/preview/reset' && method === 'POST') {
    sessions.delete(id)
    return new Response(null, {
      status: 303,
      headers: {
        Location: '/register',
        'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
      },
    })
  }
  if (path === '/auth/me' && method === 'GET') {
    return session.signedIn
      ? json(me())
      : error('unauthorized', '请先登录', 401)
  }
  if (path === '/auth/signup' && method === 'POST') {
    const { code, displayName, email, password } = await request.json()
    if (code !== INVITE) {
      return error('invalid_code', '本地注册码为 LOCAL-PREVIEW', 403)
    }
    if (!displayName?.trim()) return error('invalid_display_name', '请输入昵称')
    if (!email?.includes('@')) return error('invalid_email', '请输入邮箱')
    if (typeof password !== 'string' || password.length < 8) {
      return error('weak_password', '密码至少 8 位')
    }
    return signup(displayName.trim(), email)
  }
  if (path === '/auth/sms/code' && method === 'POST') {
    const { phone, inviteCode } = await request.json()
    if (!/^1\d{10}$/.test(phone ?? '')) {
      return error('invalid_phone', '手机号格式不正确')
    }
    const registered = session.account?.phone === phone
    if (!registered && inviteCode !== INVITE) {
      return error('invalid_code', '本地注册码为 LOCAL-PREVIEW', 403)
    }
    session.pendingPhone = phone
    return json({ registered })
  }
  if (path === '/auth/sms/verify' && method === 'POST') {
    const { phone, code, displayName } = await request.json()
    if (session.pendingPhone !== phone || code !== SMS_CODE) {
      return error('invalid_sms_code', '本地短信验证码为 123456', 403)
    }
    if (session.account?.phone === phone) {
      session.pendingPhone = null
      session.signedIn = true
      return json(me())
    }
    if (!displayName?.trim()) return error('invalid_display_name', '请输入昵称')
    session.pendingPhone = null
    return signup(displayName.trim(), undefined, phone)
  }
  if (path === '/auth/login' && method === 'POST') {
    const { email, password } = await request.json()
    if (email !== session.account?.email || !password) {
      return error('invalid_credentials', '请先在本次本地预览中注册', 401)
    }
    session.signedIn = true
    return json(me())
  }
  if (path === '/auth/logout' && method === 'POST') {
    session.signedIn = false
    return json({ ok: true })
  }
  const scene = scenarioFor(session)
  if (path === '/landing') {
    return json({
      demoMatches: [],
      topPlayers: [],
      totalMatches: session.matches.size,
    })
  }
  if (path === '/config') {
    return json({
      ...config,
      usage: { battlesToday: session.matches.size, pvpBattlesToday: 0 },
    })
  }
  if (path === '/models') return json({ models: config.models })
  if (path === '/scenarios') return json({ scenarios: [scene.summary] })
  if (path === `/scenarios/${scene.summary.id}`) return json(scene)

  if (!session.signedIn) return error('unauthorized', '请先登录', 401)
  const allMatches = () =>
    [...session.matches.values()].map((match) =>
      snapshot(session, match).summary
    ).reverse()
  const won = (match: PreviewMatch) =>
    match.detail.summary.participants?.[match.detail.summary.winner as Side]
      ?.isMine === true
  const quoteCost = (side: string) => {
    const previous = allMatches()[0]
    return previous?.participants?.[side as Side]?.isMine ? 200 : 100
  }
  if (path === '/account/preset-usage') {
    if (method === 'POST') {
      const { scenarioID } = await request.json()
      if (scenarioID !== scene.summary.id) {
        return error('invalid_scenario', '场景不存在')
      }
      session.presetScenarioIDs.add(scenarioID)
    }
    return json({ scenarioIDs: [...session.presetScenarioIDs] })
  }
  if (path === '/achievements') {
    return json({ achievements: [], eventCursor: 0 })
  }
  if (path === '/achievements/events') return json({ events: [], cursor: 0 })
  if (path === '/my/archived-agents') return json({ agents: [] })
  if (path === '/my/agents') {
    const sideAgents = (side: Side) =>
      [...session.agents].filter(([, agent]) => agent.side === side).map((
        [agentID, agent],
      ) => ({
        agentID,
        name: agent.name,
        versionCount: agent.versions.length,
        latestVersionID: agent.versions.at(-1)?.id ?? null,
        entryVersionID: agent.versions.find((version) => version.isEntry)?.id ??
          null,
      }))
    return json({
      scenarios: [{
        scenarioID: scene.summary.id,
        title: scene.summary.title,
        sides: { a: sideAgents('a'), b: sideAgents('b') },
        gateProgress: scene.summary.gateProgress,
        entryReady: false,
      }],
    })
  }
  if ((path === '/agents/ensure' || path === '/agents') && method === 'POST') {
    const { scenarioID, side, name = null } = await request.json()
    if (scenarioID !== scene.summary.id || !['a', 'b'].includes(side)) {
      return error('invalid_scenario', '场景或阵营不正确')
    }
    const existing = [...session.agents].find(([, agent]) =>
      agent.side === side
    )
    if (path === '/agents/ensure' && existing) {
      return json({ agentID: existing[0] })
    }
    const agentID = 106 + session.agents.size
    session.agents.set(agentID, { side, name, fields: {}, versions: [] })
    return json({ agentID })
  }
  if (path === '/rewards/quote') {
    return json({
      cost: quoteCost(url.searchParams.get('side') ?? 'a'),
      perBattleCost: 100,
      repeatRoleSurcharge: quoteCost(url.searchParams.get('side') ?? 'a') > 100,
      battleCosts: [quoteCost(url.searchParams.get('side') ?? 'a')],
    })
  }
  if (path === '/rewards') {
    return json({
      balance: session.balance,
      dailyAllowance: 1000,
      battleCost: 100,
      dailyRuns: 10,
      pveWinRefundPercent: 50,
      pvpWinRefundPercent: 75,
      pointsPerYuan: 100,
      nextGrantAt: Math.floor(Date.now() / 1000) + 86400,
      claimableRewards: [...session.matches].filter(([, match]) =>
        snapshot(session, match).summary.finished && won(match) &&
        !match.claimed
      ).map(([matchID]) => ({ matchID, points: 50, kind: 'pve' })),
    })
  }
  if (path === '/matches/pve' && method === 'POST') {
    const { versionID, presetKey } = await request.json()
    const entry = [...session.agents].find(([, agent]) =>
      agent.versions.some((version) => version.id === versionID)
    )
    if (!entry) return error('not_found', '未找到已保存版本', 404)
    const [agentID, agent] = entry
    const preset = scene.presets.find((item) =>
      item.key === presetKey && item.side !== agent.side
    )
    if (!preset) return error('invalid_preset', '对手预设不正确')
    const cost = quoteCost(agent.side)
    if (session.balance < cost) {
      return error('insufficient_points', '积分不足', 409)
    }
    if (
      [...session.matches.values()].some((match) =>
        !snapshot(session, match).summary.finished
      )
    ) return error('concurrency_limit', '已有对战正在进行', 409)
    const matchID = 9001 + session.matches.size
    const detail = structuredClone(finishedMatch)
    const version = agent.versions.find((item) => item.id === versionID)!
    const mine = {
      agentID,
      versionID,
      agentName: agent.name,
      ownerDisplayName: session.account!.displayName,
      modelID: version.modelID,
      isMine: true,
    }
    const opponent = {
      presetKey,
      presetLabel: preset.label,
      modelID: preset.modelID,
      isMine: false,
    }
    detail.summary = {
      ...detail.summary,
      id: matchID,
      scenarioTitle: scene.summary.title,
      initiatorIsMe: true,
      viewed: false,
      createdAt: Math.floor(Date.now() / 1000),
      participants: agent.side === 'a'
        ? { a: mine, b: opponent }
        : { a: opponent, b: mine },
    }
    session.matches.set(matchID, {
      detail,
      startedAt: Date.now(),
      completed: false,
      claimed: false,
    })
    session.balance -= cost
    return json({ matchID })
  }
  if (path === '/matches') return json({ matches: allMatches() })
  const matchPath = /^\/matches\/(\d+)(?:\/(stream|view))?$/.exec(path)
  if (matchPath) {
    const matchID = Number(matchPath[1])
    const match = session.matches.get(matchID)
    if (!match) return error('not_found', '对战不存在', 404)
    if (matchPath[2] === 'view' && method === 'POST') {
      match.detail.summary.viewed = true
      return json({ ok: true })
    }
    if (matchPath[2] === 'stream') {
      let cursor = Number(url.searchParams.get('afterTurn') ?? -1)
      return stream(request, (send) => {
        const detail = snapshot(session, match)
        for (const turn of detail.turns.filter((turn) => turn.seq > cursor)) {
          send(
            {
              turnCompleted: {
                matchID,
                seq: turn.seq,
                channel: turn.channel,
                kind: turn.kind,
              },
            } satisfies MatchEventDTO,
          )
          cursor = turn.seq
        }
        if (!detail.summary.finished) return false
        send(
          {
            matchFinished: { matchID, winner: detail.summary.winner! },
          } satisfies MatchEventDTO,
        )
        return true
      })
    }
    return json(snapshot(session, match))
  }
  const rewardPath = /^\/rewards\/matches\/(\d+)(\/claim)?$/.exec(path)
  if (rewardPath) {
    const matchID = Number(rewardPath[1])
    const match = session.matches.get(matchID)
    if (!match) return error('not_found', '对战不存在', 404)
    const finished = snapshot(session, match).summary.finished
    const eligible = won(match)
    if (rewardPath[2] && method === 'POST') {
      if (!finished || !eligible) return error('ineligible', '暂不可领取', 409)
      const alreadyClaimed = match.claimed
      if (!alreadyClaimed) session.balance += 50
      match.claimed = true
      return json({
        matchID,
        creditedPoints: alreadyClaimed ? 0 : 50,
        alreadyClaimed,
        balance: session.balance,
      })
    }
    return json({
      matchID,
      points: eligible ? 50 : 0,
      kind: 'pve',
      status: match.claimed
        ? 'claimed'
        : finished && eligible
        ? 'claimable'
        : 'ineligible',
    })
  }
  if (path === '/notifications' && method === 'GET') {
    allMatches()
    return json({
      notifications: session.notifications,
      unreadCount: session.notifications.filter((item) => !item.read).length,
    })
  }
  if (path === '/notifications/bell') {
    return stream(request, (send) => {
      allMatches()
      send({
        unreadCount: session.notifications.filter((item) => !item.read).length,
      })
      return false
    })
  }
  const notification = /^\/notifications\/(\d+)\/read$/.exec(path)
  if (notification && method === 'POST') {
    const item = session.notifications.find((item) =>
      item.id === Number(notification[1])
    )
    if (item) item.read = true
    return json({ ok: true })
  }
  if (path === '/notifications/read-all' && method === 'POST') {
    session.notifications.forEach((item) => item.read = true)
    return json({ ok: true })
  }
  if (path === '/notifications' && method === 'DELETE') {
    session.notifications = []
    return json({ ok: true })
  }

  const npcPath = /^\/scenarios\/shangyang-court\/npcs\/([^/]+)(\/matches)?$/
    .exec(path)
  if (npcPath) {
    const preset = scene.presets.find((preset) =>
      preset.key === decodeURIComponent(npcPath[1])
    )
    const sourceMatchID = Number(url.searchParams.get('matchID'))
    const source = session.matches.get(sourceMatchID)
    const side = preset?.side as Side | undefined
    if (
      !preset || !source || !side ||
      source.detail.summary.participants?.[side].presetKey !== preset.key
    ) return error('not_found', '该场对局的 NPC 配置不存在', 404)
    const matches = allMatches().filter((match) =>
      match.participants?.[side].presetKey === preset.key
    )
    if (npcPath[2]) return json({ matches })
    const finished = matches.filter((match) => match.finished)
    const wins = finished.filter((match) => match.winner === side).length
    return json(
      {
        sourceMatchID,
        scenarioID: scene.summary.id,
        scenarioTitle: scene.summary.title,
        key: preset.key,
        side,
        sideName: side === 'a'
          ? scene.summary.sideAName
          : scene.summary.sideBName,
        label: preset.label,
        modelID: preset.modelID,
        prompt: side === 'a'
          ? '先澄清争点，再用最短证据链回应。'
          : '强调迁移成本。',
        versionTag: 'v1',
        matchCount: finished.length,
        winCount: wins,
        drawCount: finished.filter((match) => !match.winner).length,
        lossCount: finished.filter((match) =>
          match.winner && match.winner !== side
        ).length,
        challengeCount: matches.length,
      } satisfies NPCProfileResponse,
    )
  }

  const agentPath =
    /^\/agents\/(\d+)(?:\/(draft|versions|diff|mutate|save|stream|matches|entry\/(\d+)))?$/
      .exec(path)
  if (agentPath) {
    const agentID = Number(agentPath[1])
    const agent = session.agents.get(agentID)
    if (!agent) return error('not_found', '智能体不存在', 404)
    if (!agentPath[2] && method === 'PATCH') {
      agent.name = (await request.json()).name ?? null
      return json({ ok: true })
    }
    if (agentPath[2] === 'draft') {
      return json({
        fields: agent.fields,
        scenarioID: scene.summary.id,
        side: agent.side,
      })
    }
    if (agentPath[2] === 'versions') {
      const summaries = allMatches().filter((match) => match.finished)
      return json({
        versions: agent.versions.map((version) => {
          const played = summaries.filter((match) =>
            match.participants?.[agent.side].versionID === version.id
          )
          return {
            ...version,
            matchCount: played.length,
            winCount: played.filter((match) =>
              match.winner === agent.side
            ).length,
            lossCount: played.filter((match) =>
              match.winner && match.winner !== agent.side
            ).length,
            drawCount: played.filter((match) => !match.winner).length,
          }
        }),
        entryVersionID: agent.versions.find((version) => version.isEntry)?.id ??
          null,
      })
    }
    if (agentPath[2] === 'stream') return stream(request, () => false)
    if (agentPath[2] === 'matches') {
      return json({
        matches: allMatches().filter((match) =>
          match.participants?.[agent.side].versionID ===
            Number(url.searchParams.get('versionID'))
        ),
      })
    }
    if (agentPath[2] === 'diff') {
      return json({
        base: agent.versions.find((version) =>
          version.id === Number(url.searchParams.get('base'))
        ),
        head: agent.versions.find((version) =>
          version.id === Number(url.searchParams.get('head'))
        ),
      })
    }
    if (agentPath[2] === 'mutate' && method === 'POST') {
      const { field, value } = await request.json()
      agent.fields[field] = value
      return json({ ok: true })
    }
    if (agentPath[2] === 'save' && method === 'POST') {
      const input = await request.json()
      const version: AgentVersionDTO = {
        ...input,
        id: agentID * 100 + agent.versions.length + 1,
        agentID,
        ordinal: agent.versions.length + 1,
        snapshotSeq: agent.versions.length * 4,
        isEntry: false,
        createdAt: Math.floor(Date.now() / 1000),
      }
      agent.versions.push(version)
      // Saving is independent from dispatching, but must agree with draft read-back.
      agent.fields.prompt = version.prompt
      agent.fields.modelID = version.modelID
      return json(version)
    }
    if (agentPath[3] && method === 'POST') {
      const selected = agent.versions.find((version) =>
        version.id === Number(agentPath[3])
      )
      if (!selected) return error('not_found', '版本不存在', 404)
      agent.versions.forEach((version) =>
        version.isEntry = version === selected
      )
      return json({ ok: true })
    }
  }
  if (path === `/scenarios/${scene.summary.id}/opponents`) {
    return json({ opponents: [] })
  }
  console.error(`Unimplemented first-battle preview API: ${method} ${path}`)
  return error('preview_unavailable', '此预览未提供这项数据。', 404)
}

export const firstBattlePreviewLanding = `<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>首战完整流程 · 本地模拟</title>
<style>body{max-width:720px;margin:40px auto;padding:0 20px;color:#111;background:white;font:15px/1.8 Arial,sans-serif}a{color:#164a91;text-decoration:underline}button{font:inherit}a:focus-visible,button:focus-visible{outline:2px solid #164a91;outline-offset:3px}</style>
<h1>首战完整流程 · 本地模拟</h1>
<p>使用正式页面体验注册、朝堂介绍、创建智能体、构建和保存策略、出战、实况、战报、领奖及战后引导。所有记录仅保留在当前浏览器会话与本地服务中。</p>
<p>注册码：<strong>LOCAL-PREVIEW</strong>。邮箱填任意测试地址，密码至少 8 位。也可选择手机号，短信验证码固定为 <strong>123456</strong>，不会发送真实短信。</p>
<p>对战使用预先编写的示例对白，约 9 秒结束；模拟扣除与返还积分，不调用模型或线上服务。</p>
<p><a href="/register">从注册开始</a> · <a href="/express">继续首战</a> · <a href="/matches">对战历史</a></p>
<form method="post" action="/preview/reset"><button>清空本次模拟，从注册重新体验</button></form>
</html>`
