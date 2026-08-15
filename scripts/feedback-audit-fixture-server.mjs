#!/usr/bin/env node

import http from 'node:http'

const port = Number(process.env.AXIIA_AUDIT_FIXTURE_PORT ?? 8091)

const scenario = {
  id: 'shangyang-court',
  title: '商鞅变法 · 朝堂辩法',
  subject: '在秦孝公面前辩论变法，同时隐藏并识破真正诉求。',
  sideAName: '商鞅',
  sideBName: '甘龙',
  sideALabel: '推行变法',
  sideBLabel: '维持现状',
  turnCount: 5,
  gateUnlocked: true,
  gateProgress: {
    a: { beaten: 1, needed: 1 },
    b: { beaten: 1, needed: 1 },
  },
}

const secondScenario = {
  id: 'trolley-problem',
  title: '电车难题 · 道德抉择',
  subject: '用原则与后果说服裁判。',
  sideAName: '扳动拉杆',
  sideBName: '维持原状',
  sideALabel: '结果主义立场',
  sideBLabel: '义务论立场',
  turnCount: 6,
  gateUnlocked: false,
  gateProgress: {
    a: { beaten: 1, needed: 1 },
    b: { beaten: 0, needed: 1 },
  },
}

const stages = [
  { id: 'debate', title: '朝堂对辩', channels: [{ id: 'court', label: '朝堂' }] },
  {
    id: 'inquiry',
    title: '单独问询',
    channels: [
      { id: 'inquiry-a', label: '问商鞅' },
      { id: 'inquiry-b', label: '问甘龙' },
    ],
  },
]

const versions = [
  {
    id: 501,
    agentID: 101,
    prompt: '先以河西危局证明变法的必要性，再把真正诉求藏在可执行的制度细节里。',
    modelID: 'deepseek-v4-pro',
    isEntry: true,
    snapshotSeq: 3,
  },
  {
    id: 499,
    agentID: 101,
    prompt: '以国力和法令可信度为主线，逐项回应世族的风险质疑。',
    modelID: 'deepseek-v4-pro',
    parentVersionID: 497,
    isEntry: false,
    snapshotSeq: 2,
  },
  {
    id: 497,
    agentID: 101,
    prompt: '强调秦国积弱与改革窗口。',
    modelID: 'qwen-max',
    isEntry: false,
    snapshotSeq: 1,
  },
]

const finishedMatch = {
  summary: {
    id: 901,
    scenarioID: scenario.id,
    scenarioTitle: scenario.title,
    kind: 'pve',
    dispatched: true,
    finished: true,
    scored: true,
    winner: 'a',
  },
  currentTurn: 8,
  turns: [
    {
      seq: 0,
      channel: 'court',
      kind: 'dialogue',
      speaker: 'a',
      finalText: '秦国若仍守旧制，河西之失只会重演。法令必须先从宗室与百官一体执行。',
      reasoning: '先建立改革的紧迫性，再把制度诉求包装成执行条件。',
    },
    {
      seq: 1,
      channel: 'court',
      kind: 'dialogue',
      speaker: 'b',
      finalText: '骤改祖制会先乱朝纲；国弱不能成为把全部风险押在一人身上的理由。',
      reasoning: '攻击执行风险，避免直接暴露真正想守住的议政权。',
    },
    {
      seq: 2,
      channel: 'court',
      kind: 'dialogue',
      speaker: 'a',
      finalText: '变法不是任性，而是把功过写进人人看得见的尺度。',
      reasoning: '把裁判最关心的可执行性放到台前。',
    },
    {
      seq: 3,
      channel: 'court',
      kind: 'dialogue',
      speaker: 'b',
      finalText: '尺度若脱离人情，令出而民疑，反会削弱君上的权威。',
      reasoning: '以稳定性对冲改革收益。',
    },
    {
      seq: 4,
      channel: 'inquiry-a',
      kind: 'dialogue',
      speaker: 'a',
      finalText: '甘龙真正要守的是太师府议政之权。',
      reasoning: '根据他持续强调朝纲与旧臣程序来判断。',
    },
    {
      seq: 5,
      channel: 'inquiry-b',
      kind: 'dialogue',
      speaker: 'b',
      finalText: '商鞅真正所求是督察宗室之权。',
      reasoning: '他反复将宗室纳入法令执行。',
    },
    {
      seq: 6,
      channel: 'court',
      kind: 'event',
      speaker: 'judge',
      finalText: '',
      event: {
        type: 'verdict',
        requests: { SR1: '同意', SR2: '驳回', GR1: '驳回', GR2: '同意' },
      },
    },
    {
      seq: 7,
      channel: 'court',
      kind: 'event',
      speaker: 'judge',
      finalText: '',
      event: {
        type: 'score',
        trueRequests: { a: 'SR1', b: 'GR2' },
        guesses: { a: 'GR2', b: 'SR1' },
        scoreA: 1.5,
        scoreB: 0.5,
      },
    },
  ],
  verdicts: [
    {
      key: 'os-1',
      afterSeq: 2,
      output: JSON.stringify({
        os: '商鞅抓住了国弱的要害，但朕更要看他如何约束执行风险。',
        attention: '变法是否可执行',
        favor: '商鞅',
        strength: '轻微',
      }),
      model: 'deepseek-v4-pro',
    },
    {
      key: 'os-2',
      afterSeq: 4,
      output: JSON.stringify({
        os: '甘龙所言稳妥，却没有回答旧制如何救当前危局。',
        attention: '旧制的替代方案',
        favor: '商鞅',
        strength: '明显',
      }),
      model: 'deepseek-v4-pro',
    },
    {
      key: 'final',
      afterSeq: 8,
      output: JSON.stringify({
        winner: 'a',
        judgment: '推行变法',
        reason: '商鞅给出了更完整的危机判断与执行路径。',
      }),
      model: 'deepseek-v4-pro',
    },
  ],
  scoreA: 1.5,
  scoreB: 0.5,
  reasoning: '程序化计分明细：\n商鞅：大政 +1，真请求 +0.5。\n甘龙：真请求 +0.5，但真目标被猜中 −1。',
  stages,
  speakerLabels: { a: '商鞅', b: '甘龙', judge: '秦孝公' },
}

function json(res, status, payload, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  })
  res.end(JSON.stringify(payload))
}

function isSignedIn(req) {
  return /(?:^|;\s*)axiia_audit_session=1(?:;|$)/.test(req.headers.cookie ?? '')
}

function startSSE(res, payload) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  if (payload) res.write(`data: ${JSON.stringify(payload)}\n\n`)
  const timer = setInterval(() => res.write(': audit fixture\n\n'), 15_000)
  res.on('close', () => clearInterval(timer))
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const path = url.pathname

  if (path === '/v1/auth/me') {
    if (!isSignedIn(req)) {
      return json(res, 401, { error: 'unauthorized', message: '未登录' })
    }
    return json(res, 200, {
      account: {
        id: 'audit-user',
        email: 'audit@example.com',
        displayName: '审计演示用户',
        isAdmin: false,
        hasTOTP: false,
      },
      elevated: false,
    })
  }

  if (path === '/v1/auth/login' || path === '/v1/auth/signup') {
    return json(
      res,
      200,
      {
        account: {
          id: 'audit-user',
          email: 'audit@example.com',
          displayName: '审计演示用户',
          isAdmin: false,
          hasTOTP: false,
        },
        elevated: false,
      },
      { 'Set-Cookie': 'axiia_audit_session=1; Path=/; HttpOnly; SameSite=Lax' },
    )
  }

  if (path === '/v1/auth/logout') {
    return json(res, 200, { ok: true }, {
      'Set-Cookie': 'axiia_audit_session=; Path=/; Max-Age=0',
    })
  }

  if (!isSignedIn(req)) {
    return json(res, 401, { error: 'unauthorized', message: '未登录' })
  }

  if (path === '/v1/notifications/bell') {
    return startSSE(res, { unreadCount: 2 })
  }
  if (/^\/v1\/agents\/\d+\/stream$/.test(path)) {
    return startSSE(res)
  }

  if (path === '/v1/scenarios') {
    return json(res, 200, { scenarios: [scenario, secondScenario] })
  }
  if (path === '/v1/models') {
    return json(res, 200, {
      models: [
        { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
        { id: 'qwen-max', label: 'Qwen Max' },
      ],
    })
  }
  if (path === '/v1/config') {
    return json(res, 200, {
      dailyBattleLimit: 20,
      pvpDailyLimit: 10,
      concurrencyLimit: 2,
      pvpUnlockPerSideWins: 1,
      statsDisplayThreshold: 20,
      promptUnitLimit: 1000,
      expressPreset: { scenarioID: scenario.id, side: 'a', presetKey: 'ganlong-steady' },
      models: [{ id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' }],
      visibility: { ownerOnly: ['prompt', 'ownThinkingTrace', 'judgeOsPrompt'] },
      opponentDailyChallengeLimit: 3,
      trialsBlocked: false,
      usage: { battlesToday: 4, pvpBattlesToday: 1 },
    })
  }
  if (path === '/v1/my/agents') {
    return json(res, 200, {
      scenarios: [
        {
          scenarioID: scenario.id,
          title: scenario.title,
          sides: {
            a: [{ agentID: 101, versionCount: 3, entryVersionID: 501, latestVersionID: 501 }],
            b: [{ agentID: 102, versionCount: 1, entryVersionID: 502, latestVersionID: 502 }],
          },
          gateProgress: scenario.gateProgress,
          entryReady: true,
        },
        {
          scenarioID: secondScenario.id,
          title: secondScenario.title,
          sides: {
            a: [{ agentID: 201, versionCount: 1, latestVersionID: 601 }],
            b: [],
          },
          gateProgress: secondScenario.gateProgress,
          entryReady: false,
        },
      ],
    })
  }

  if (path === `/v1/scenarios/${scenario.id}`) {
    return json(res, 200, {
      summary: scenario,
      stages,
      presets: [
        { key: 'shangyang-direct', side: 'a', label: '商鞅 · 直陈利害', modelID: 'qwen-max' },
        { key: 'shangyang-indirect', side: 'a', label: '商鞅 · 迂回布局', modelID: 'qwen-max' },
        { key: 'ganlong-steady', side: 'b', label: '甘龙 · 稳守祖制', modelID: 'qwen-max' },
        { key: 'ganlong-hard', side: 'b', label: '甘龙 · 强硬反驳', modelID: 'qwen-max' },
      ],
    })
  }
  if (path === `/v1/scenarios/${secondScenario.id}`) {
    return json(res, 200, { summary: secondScenario, stages, presets: [] })
  }
  if (/^\/v1\/scenarios\/[^/]+\/opponents$/.test(path)) {
    return json(res, 200, {
      opponents: [
        { agentID: 102, displayName: '我的甘龙智能体', isSelf: true },
        { agentID: 302, displayName: '玩家「墨客」的甘龙', isSelf: false },
      ],
    })
  }

  if (path === '/v1/agents/ensure') return json(res, 200, { agentID: 101 })
  if (path === '/v1/agents/101/draft') {
    return json(res, 200, {
      fields: { prompt: versions[0].prompt },
      scenarioID: scenario.id,
      side: 'a',
    })
  }
  if (path === '/v1/agents/101/versions') {
    return json(res, 200, { versions, entryVersionID: 501 })
  }
  if (path === '/v1/agents/101/diff') {
    const base = versions.find((item) => item.id === Number(url.searchParams.get('base'))) ?? versions[1]
    const head = versions.find((item) => item.id === Number(url.searchParams.get('head'))) ?? versions[0]
    return json(res, 200, { base, head })
  }
  if (/^\/v1\/agents\/\d+\/(mutate|save|entry\/\d+)$/.test(path)) {
    return json(res, 200, path.includes('/save') ? versions[0] : { ok: true })
  }

  if (path === '/v1/matches') {
    return json(res, 200, {
      matches: [
        finishedMatch.summary,
        {
          id: 899,
          scenarioID: secondScenario.id,
          scenarioTitle: secondScenario.title,
          kind: 'pvp',
          dispatched: true,
          finished: true,
          scored: true,
          winner: 'b',
        },
      ],
      open: false,
    })
  }
  if (path === '/v1/matches/901') return json(res, 200, finishedMatch)
  if (path === '/v1/matches/pve' || path === '/v1/matches/pvp') {
    return json(res, 200, { matchID: 901 })
  }

  if (path === '/v1/notifications') {
    return json(res, 200, {
      unreadCount: 2,
      notifications: [
        { id: 1, kind: 'battle_finished', matchID: 901, read: false },
        { id: 2, kind: 'battle_finished', matchID: 899, read: false },
      ],
    })
  }
  if (/^\/v1\/notifications\/\d+\/read$/.test(path)) {
    return json(res, 200, { ok: true })
  }

  if (path === '/v1/tournaments') {
    return json(res, 200, {
      tournaments: [{ id: 41, scenarioID: scenario.id, status: 'active', currentRound: 2, totalRounds: 4 }],
    })
  }
  if (path === '/v1/tournaments/41/standings') {
    return json(res, 200, {
      entries: [
        { submissionID: 3001, wins: 4, losses: 0, buchholz: 9, matchesPlayed: 4, winRate: 1, rank: 1 },
        { submissionID: 3002, wins: 3, losses: 1, buchholz: 8, matchesPlayed: 4, winRate: 0.75, rank: 2 },
      ],
    })
  }

  return json(res, 404, { error: 'fixture_not_found', message: `No audit fixture for ${path}` })
})

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`feedback audit fixture listening on http://127.0.0.1:${port}\n`)
})

