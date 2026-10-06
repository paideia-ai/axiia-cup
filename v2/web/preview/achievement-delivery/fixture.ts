import type {
  AchievementDTO,
  AchievementEventDTO,
  EarnedAchievementDTO,
} from '../../src/api/types'

const STORAGE_KEY = 'axiia-achievement-delivery-preview-v1'
const ACCOUNT_KEY = 'axiia-achievement-delivery-preview-account'
export const ACCOUNTS = ['delivery-preview-a', 'delivery-preview-b'] as const
export const READ_EVENT = 'achievement-delivery-preview:read'

type Sample = Omit<EarnedAchievementDTO, 'unlockedAt' | 'matchID'>
const samples: Sample[] = [
  {
    id: 'philosopher',
    tier: 'gold',
    unlocked: true,
    title: '大哲学家',
    flavor: '还有下一题吗？',
    description: '在一场电车难题 PvP 中，赢下全部三个案件。',
    iconURL: '/achievements/philosopher.webp',
  },
  {
    id: 'first-word',
    tier: 'bronze',
    unlocked: true,
    title: '初试锋芒',
    flavor: '有人听进去了。',
    description: '赢得你的第一场对局。',
    iconURL: '/achievements/first-word.webp',
  },
  {
    id: 'four-endings',
    tier: 'gold',
    unlocked: true,
    title: '戏里戏外',
    flavor: '同一句愿意，可以有四种故事。',
    description:
      '在凤仪亭 PvP 中，分别以董卓、吕布赢得“继续连环计”和“放弃连环计”两种结局。',
    iconURL: '/achievements/four-endings.webp',
  },
  {
    id: 'hundred-losses',
    tier: 'bronze',
    unlocked: true,
    title: '百折，尚未不挠',
    flavor: '',
    description: '累计输掉 100 场对局。',
    iconURL: '/achievements/hundred-losses.webp',
  },
]

interface FixtureAccount {
  events: AchievementEventDTO[]
  scheduledAt: number | null
}
type FixtureWorld = Record<string, FixtureAccount>

function makeEvent(
  index: number,
  occurredAt: number,
  source: AchievementEventDTO['source'],
): AchievementEventDTO {
  return {
    id: index + 1,
    achievement: {
      ...samples[index],
      unlockedAt: occurredAt,
      matchID: null,
    },
    notificationID: index + 1,
    source,
    occurredAt,
  }
}

function loadWorld(): FixtureWorld {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : {}
}
function saveWorld(world: FixtureWorld) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(world))
}
export function selectedAccount() {
  const selected = localStorage.getItem(ACCOUNT_KEY)
  return ACCOUNTS.find((account) => account === selected) ?? ACCOUNTS[0]
}
export function selectAccount(accountID: string) {
  localStorage.setItem(ACCOUNT_KEY, accountID)
  globalThis.dispatchEvent(new Event('achievement-delivery-preview:change'))
}

export function fixtureAccount(accountID: string): FixtureAccount {
  const world = loadWorld()
  let changed = false
  if (!world[accountID]) {
    world[accountID] = {
      events: [makeEvent(0, Date.now() / 1000 - 86_400, 'backfill')],
      scheduledAt: null,
    }
    changed = true
  }
  const account = world[accountID]
  if (account.scheduledAt != null && Date.now() >= account.scheduledAt) {
    const occurredAt = account.scheduledAt / 1000
    account.events = samples.map((_, index) =>
      account.events[index] ?? makeEvent(index, occurredAt, 'live')
    )
    account.scheduledAt = null
    changed = true
  }
  if (changed) saveWorld(world)
  return account
}

export function grantThree(accountID: string, delayMs = 0) {
  const account = fixtureAccount(accountID)
  const world = loadWorld()
  world[accountID] = { ...account, scheduledAt: Date.now() + delayMs }
  saveWorld(world)
  fixtureAccount(accountID)
  globalThis.dispatchEvent(new Event('achievement-delivery-preview:change'))
}

export function resetPreview() {
  localStorage.removeItem(STORAGE_KEY)
  for (const account of ACCOUNTS) {
    sessionStorage.removeItem(`axiia-achievement-cursor-v1:${account}`)
    localStorage.removeItem(`axiia-achievement-toasts-v1:${account}`)
  }
  globalThis.location.reload()
}

export function collection(accountID: string): AchievementDTO[] {
  const { events } = fixtureAccount(accountID)
  return samples.map((sample, index) =>
    events.find((event) => event.achievement.id === sample.id)?.achievement ?? {
      id: `locked-${index}`,
      tier: sample.tier,
      unlocked: false,
    }
  )
}

// This adapter is only bundled into the standalone fixture. The actual product
// provider, client, cursor storage, toast receipts and toast remain unchanged.
// Browser persistence gives reloads and sibling tabs the same immutable events.
export function installFixtureAPI() {
  const originalFetch = globalThis.fetch.bind(globalThis)
  globalThis.fetch = (input, init) => {
    const url = new URL(
      input instanceof Request ? input.url : String(input),
      location.origin,
    )
    if (
      !['/v1/achievements', '/v1/achievements/events'].includes(url.pathname)
    ) {
      return originalFetch(input, init)
    }
    if (init?.signal?.aborted) {
      return Promise.reject(new DOMException('Aborted', 'AbortError'))
    }
    const accountID = selectedAccount()
    const { events } = fixtureAccount(accountID)
    const eventCursor = events.at(-1)?.id ?? 0
    if (url.pathname.endsWith('/events')) {
      const after = Number(url.searchParams.get('after') ?? 0)
      const batch = events.filter((event) => event.id > after)
      globalThis.dispatchEvent(
        new CustomEvent(READ_EVENT, {
          detail: { accountID, after, ids: batch.map((event) => event.id) },
        }),
      )
      return Promise.resolve(
        Response.json({ events: batch, cursor: eventCursor }),
      )
    }
    return Promise.resolve(
      Response.json({ achievements: collection(accountID), eventCursor }),
    )
  }
}
