// One-shot provisioner for the B3/A5 human-verification handoff on the shared
// beta. It creates isolated player accounts and stable, non-secret fixture IDs.
// Credentials are written only to an explicitly supplied private file; stdout
// contains a redacted summary. This tool never changes existing users or slots.

import { adminSession, HttpError, Session, totp } from './http.ts'

type Side = 'a' | 'b'

interface RoleSpec {
  id: string
  reviewer: 'Melody' | 'Vivian'
  displayName: string
}

interface PrivateRole extends RoleSpec {
  email: string
  password: string
  accountID?: string
}

interface VersionRef {
  id: number
  agentID: number
  ordinal: number
}

interface AgentFixture {
  agentID: number
  versions: VersionRef[]
}

const roles: RoleSpec[] = [
  {
    id: 'b3-rich-owner',
    reviewer: 'Melody',
    displayName: 'B3 人测·完整所有者',
  },
  {
    id: 'b3-viewer-missing',
    reviewer: 'Melody',
    displayName: 'B3 人测·访客缺侧',
  },
  {
    id: 'a5-rich-challenger',
    reviewer: 'Vivian',
    displayName: 'A5 人测·完整发起方',
  },
  {
    id: 'a5-missing-side',
    reviewer: 'Vivian',
    displayName: 'A5 人测·缺侧玩家',
  },
  {
    id: 'a5-hotseat-locked',
    reviewer: 'Vivian',
    displayName: 'A5 人测·锁定热座',
  },
  {
    id: 'a5-quota-invitee',
    reviewer: 'Vivian',
    displayName: 'A5 人测·配额被约方',
  },
]

const baseURL = Deno.env.get('AXIIA_BASE_URL') ?? ''
const adminEmail = Deno.env.get('AXIIA_ADMIN_EMAIL') ?? ''
const adminPassword = Deno.env.get('AXIIA_ADMIN_PASSWORD') ?? ''
const adminTotpSecret = Deno.env.get('AXIIA_ADMIN_TOTP_SECRET') ?? ''
const approval = Deno.env.get('AXIIA_SHARED_FIXTURE_APPROVAL') ?? ''
const privateOut = Deno.env.get('AXIIA_PRIVATE_OUT') ?? ''
const publicOut = Deno.env.get('AXIIA_PUBLIC_OUT') ?? ''

if (Deno.args[0] !== '--apply') {
  console.error('usage: provision-b3-a5-human.ts --apply')
  Deno.exit(2)
}
if (baseURL !== 'https://axiia-cup-2-web.isofucius.cn') {
  console.error('AXIIA_BASE_URL must name the reviewed current beta origin')
  Deno.exit(2)
}
if (approval !== 'user-requested-b3-a5-2026-09-07') {
  console.error(
    'AXIIA_SHARED_FIXTURE_APPROVAL does not match this reviewed run',
  )
  Deno.exit(2)
}
if (
  !adminEmail || !adminPassword || !adminTotpSecret || !privateOut || !publicOut
) {
  console.error('admin credentials and both output paths are required')
  Deno.exit(2)
}

const bytes = (size: number) => crypto.getRandomValues(new Uint8Array(size))
const hex = (value: Uint8Array) =>
  [...value].map((part) => part.toString(16).padStart(2, '0')).join('')
const randomToken = (prefix: string, size = 12) =>
  `${prefix}${hex(bytes(size))}`
const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
const batch = `${stamp}-${hex(bytes(3))}`
const registrationCode = randomToken('HV-', 10)

const privateRoles: PrivateRole[] = roles.map((role) => ({
  ...role,
  email: `hv-${role.id}-${batch}@axiia.test`,
  password: randomToken('Hv!', 14),
}))

async function writePrivate(state: string) {
  await Deno.writeTextFile(
    privateOut,
    `${
      JSON.stringify({ state, baseURL, batch, roles: privateRoles }, null, 2)
    }\n`,
    { mode: 0o600 },
  )
  await Deno.chmod(privateOut, 0o600)
}

async function elevatedAdmin() {
  try {
    return await adminSession(
      baseURL,
      adminEmail,
      adminPassword,
      adminTotpSecret,
    )
  } catch (error) {
    if (!(error instanceof HttpError) || error.status !== 401) throw error
  }
  const session = new Session(baseURL)
  await session.call('POST', '/v1/auth/login', {
    email: adminEmail,
    password: adminPassword,
  })
  await session.call('POST', '/v1/auth/elevate', {
    code: await totp(adminTotpSecret, Math.floor(Date.now() / 1000) + 30),
  })
  return session
}

async function signup(role: PrivateRole, code: string) {
  const session = new Session(baseURL)
  const me = await session.call<{ account: { id: string } }>(
    'POST',
    '/v1/auth/signup',
    {
      code,
      email: role.email,
      password: role.password,
      displayName: role.displayName,
    },
  )
  role.accountID = me.account.id
  await writePrivate('accounts-in-progress')
  return session
}

async function ensureAgent(session: Session, side: Side, name: string) {
  const created = await session.call<{ agentID: number }>(
    'POST',
    '/v1/agents/ensure',
    {
      scenarioID: 'shangyang-court',
      side,
    },
  )
  await session.call('PATCH', `/v1/agents/${created.agentID}`, { name })
  return created.agentID
}

async function createAgent(session: Session, side: Side, name: string) {
  const created = await session.call<{ agentID: number }>(
    'POST',
    '/v1/agents',
    {
      scenarioID: 'shangyang-court',
      side,
      name,
    },
  )
  return created.agentID
}

async function save(
  session: Session,
  agentID: number,
  prompt: string,
  note: string,
  parentVersionID: number | null = null,
) {
  return await session.call<VersionRef>('POST', `/v1/agents/${agentID}/save`, {
    prompt,
    modelID: 'deepseek-v4-flash',
    parentVersionID,
    method: 'raw',
    note,
  })
}

async function markEntry(session: Session, agentID: number, versionID: number) {
  await session.call('POST', `/v1/agents/${agentID}/entry/${versionID}`)
}

async function oneVersionAgent(
  session: Session,
  side: Side,
  name: string,
  roleID: string,
): Promise<AgentFixture> {
  const agentID = await ensureAgent(session, side, name)
  const version = await save(
    session,
    agentID,
    `【${roleID}】以事实、条件和可核验后果推进论证；先回应对方要点，再给出本方结论。`,
    `human-fixture:${batch}:${roleID}:v1`,
  )
  await markEntry(session, agentID, version.id)
  return { agentID, versions: [version] }
}

async function waitForFinished(session: Session, matchID: number) {
  const deadline = Date.now() + 8 * 60_000
  while (Date.now() < deadline) {
    const detail = await session.call<
      { summary: { finished: boolean; scored: boolean } }
    >(
      'GET',
      `/v1/matches/${matchID}`,
    )
    if (detail.summary.finished && detail.summary.scored) return true
    await new Promise((resolve) => setTimeout(resolve, 5_000))
  }
  return false
}

await writePrivate('prepared-locally')

const admin = await elevatedAdmin()
await admin.call('POST', '/v1/admin/registration-codes', {
  code: registrationCode,
  uses: roles.length,
})

const sessions = new Map<string, Session>()
for (const role of privateRoles) {
  sessions.set(role.id, await signup(role, registrationCode))
}

const b3 = sessions.get('b3-rich-owner')!
const b3MainID = await ensureAgent(b3, 'a', 'B3 主智能体')
const b3MainV1 = await save(
  b3,
  b3MainID,
  '【B3 v1】先列事实，再逐条回应；结论保持简洁。',
  `human-fixture:${batch}:b3-main:v1`,
)
const b3MainV2 = await save(
  b3,
  b3MainID,
  '【B3 v2 最新】先复述争点，再给证据、条件与后果；最后用一句话收束。',
  `human-fixture:${batch}:b3-main:v2`,
  b3MainV1.id,
)
await markEntry(b3, b3MainID, b3MainV2.id)
const b3Solo = await oneVersionAgent(
  b3,
  'b',
  'B3 另一侧唯一智能体',
  'b3-solo-side',
)
const b3SiblingID = await createAgent(b3, 'a', 'B3 同侧兄弟智能体')
const b3SiblingV1 = await save(
  b3,
  b3SiblingID,
  '【B3 同侧】用另一种结构论证，避免复述主智能体。',
  `human-fixture:${batch}:b3-sibling:v1`,
)

const b3Viewer = sessions.get('b3-viewer-missing')!
const b3Missing = await oneVersionAgent(
  b3Viewer,
  'a',
  'B3 缺侧账号智能体',
  'b3-missing-side',
)

const a5Rich = sessions.get('a5-rich-challenger')!
const a5MainID = await ensureAgent(a5Rich, 'a', 'A5 主智能体')
const a5MainVersions: VersionRef[] = []
let a5Parent: number | null = null
for (let ordinal = 1; ordinal <= 3; ordinal++) {
  const version = await save(
    a5Rich,
    a5MainID,
    `【A5 v${ordinal}】这是可明确区分的第 ${ordinal} 版；按事实、反驳、结论三段作答。`,
    `human-fixture:${batch}:a5-main:v${ordinal}`,
    a5Parent,
  )
  a5MainVersions.push(version)
  a5Parent = version.id
}
await markEntry(a5Rich, a5MainID, a5MainVersions[0].id)
const a5Opposite = await oneVersionAgent(
  a5Rich,
  'b',
  'A5 本人另一侧',
  'a5-rich-opposite',
)

const a5MissingSession = sessions.get('a5-missing-side')!
const a5Missing = await oneVersionAgent(
  a5MissingSession,
  'a',
  'A5 缺侧智能体',
  'a5-missing-side',
)

const a5Hotseat = sessions.get('a5-hotseat-locked')!
const a5HotseatA = await oneVersionAgent(
  a5Hotseat,
  'a',
  'A5 热座甲侧',
  'a5-hotseat-a',
)
const a5HotseatB = await oneVersionAgent(
  a5Hotseat,
  'b',
  'A5 热座乙侧',
  'a5-hotseat-b',
)

const a5Invitee = sessions.get('a5-quota-invitee')!
const a5InviteeA = await oneVersionAgent(
  a5Invitee,
  'a',
  'A5 被约甲侧',
  'a5-invitee-a',
)
const a5InviteeB = await oneVersionAgent(
  a5Invitee,
  'b',
  'A5 被约乙侧',
  'a5-invitee-b',
)

const tournament = await admin.call<{ id: number }>(
  'POST',
  '/v1/admin/tournaments',
  {
    scenarioID: 'shangyang-court',
    totalRounds: 1,
    pairingMode: 'manual',
  },
)
await admin.call(
  'POST',
  `/v1/admin/tournaments/${tournament.id}/participants`,
  {
    versionID: b3MainV2.id,
  },
)

const completed = await b3.call<{ matchID: number }>(
  'POST',
  '/v1/matches/pvp',
  {
    versionID: b3MainV1.id,
    opponentAgentID: b3Solo.agentID,
  },
)
const completedReady = await waitForFinished(b3, completed.matchID)

const publicManifest = {
  schemaVersion: 1,
  preparedAt: new Date().toISOString(),
  environment: 'shared-beta',
  appBaseUrl: baseURL,
  scenarioId: 'shangyang-court',
  reviewers: {
    Melody: {
      roles: {
        richOwner: {
          accountAlias: 'B3 人测·完整所有者',
          ownerAgentId: b3MainID,
          ownerVersionIds: [b3MainV1.id, b3MainV2.id],
          entryVersionId: b3MainV2.id,
          siblingAgentId: b3SiblingID,
          siblingVersionId: b3SiblingV1.id,
          soloSideAgentId: b3Solo.agentID,
          soloSideVersionId: b3Solo.versions[0].id,
          tournamentId: tournament.id,
          completedMatchId: completed.matchID,
          completedMatchReady: completedReady,
        },
        viewerMissing: {
          accountAlias: 'B3 人测·访客缺侧',
          missingSideAgentId: b3Missing.agentID,
          publicTargetAgentId: b3MainID,
        },
      },
    },
    Vivian: {
      roles: {
        richChallenger: {
          accountAlias: 'A5 人测·完整发起方',
          ownerAgentId: a5MainID,
          ownerVersionIds: a5MainVersions.map((version) => version.id),
          entryVersionId: a5MainVersions[0].id,
          oppositeAgentId: a5Opposite.agentID,
          oppositeVersionId: a5Opposite.versions[0].id,
        },
        missingSide: {
          accountAlias: 'A5 人测·缺侧玩家',
          ownerAgentId: a5Missing.agentID,
        },
        hotseatLocked: {
          accountAlias: 'A5 人测·锁定热座',
          ownerAgentId: a5HotseatA.agentID,
          ownerVersionId: a5HotseatA.versions[0].id,
          oppositeAgentId: a5HotseatB.agentID,
          oppositeVersionId: a5HotseatB.versions[0].id,
          activeMatchId: null,
        },
        quotaInvitee: {
          accountAlias: 'A5 人测·配额被约方',
          ownerAgentId: a5InviteeA.agentID,
          ownerVersionId: a5InviteeA.versions[0].id,
          oppositeAgentId: a5InviteeB.agentID,
          oppositeVersionId: a5InviteeB.versions[0].id,
          quotaState: 'refresh-required',
        },
      },
    },
  },
  knownDynamic: {
    activeMatchId: 'capture-after-hotseat-dispatch',
    npcAgentId: 'unsupported-no-npc-agent-route',
    pvpQuota: 'refresh-on-test-day',
  },
}

await Deno.writeTextFile(
  publicOut,
  `${JSON.stringify(publicManifest, null, 2)}\n`,
)
await writePrivate('ready')
console.log(JSON.stringify({
  ok: true,
  batch,
  accountsCreated: privateRoles.length,
  agentsCreated: 11,
  versionsCreated: 14,
  tournamentId: tournament.id,
  completedMatchReady: completedReady,
  privateOutputWritten: true,
  publicOutputWritten: true,
}))
