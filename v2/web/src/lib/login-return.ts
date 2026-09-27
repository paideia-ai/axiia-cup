const DEFAULT_LOGIN_RETURN = '/scenarios'
const RETURN_BASE = 'https://axiia.invalid'

interface RouteLocation {
  pathname: string
  search: string
  hash: string
}

function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index)
    if (code <= 0x1f || code === 0x7f) return true
  }
  return false
}

/** Build the guest login URL without dropping the protected route the user asked for. */
export function protectedLoginUrl(location: RouteLocation): string {
  const next = `${location.pathname}${location.search}${location.hash}`
  return `/login?${new URLSearchParams({ next }).toString()}`
}

/**
 * Read a post-login destination, accepting only an in-app absolute path.
 * This keeps `next` useful for tester deep links without turning login into an
 * open redirect (or navigating an authenticated user back into guest auth).
 */
export function loginReturnPath(search: string): string {
  const candidate = new URLSearchParams(search).get('next')
  if (
    !candidate ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    hasControlCharacter(candidate)
  ) {
    return DEFAULT_LOGIN_RETURN
  }

  try {
    const parsed = new URL(candidate, RETURN_BASE)
    if (parsed.origin !== RETURN_BASE) return DEFAULT_LOGIN_RETURN
    if (parsed.pathname === '/login' || parsed.pathname === '/register') {
      return DEFAULT_LOGIN_RETURN
    }
  } catch {
    return DEFAULT_LOGIN_RETURN
  }

  return candidate
}

/**
 * A newly registered account starts its own first battle. Preserve only a
 * deliberate scenario build entry; a generic "next" can refer to the previous
 * account's catalog, agent, or match and must not override onboarding.
 */
export function registrationReturnPath(
  search: string,
  firstBattleDone: boolean,
): string {
  const next = new URLSearchParams(search).has('next')
    ? loginReturnPath(search)
    : null
  if (firstBattleDone) return next ?? '/scenarios'
  if (next) {
    const parsed = new URL(next, RETURN_BASE)
    if (/^\/scenarios\/[^/]+\/build$/.test(parsed.pathname)) return next
    if (
      parsed.pathname === '/agents/entry' &&
      parsed.searchParams.get('target') === 'build' &&
      parsed.searchParams.has('scenario') &&
      ['a', 'b'].includes(parsed.searchParams.get('side') ?? '')
    ) return next
  }
  return '/express'
}
