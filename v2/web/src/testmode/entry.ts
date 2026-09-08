export interface TestModeEntryTarget {
  journeyId: string
  stepId?: string
}

export type FixtureNicknameState = 'match' | 'mismatch' | 'unknown'

/** Read the optional journey handoff embedded in a Test Mode entry URL. */
export function testModeEntryTarget(
  search: string,
): TestModeEntryTarget | null {
  const params = new URLSearchParams(search)
  const journeyId = params.get('tmJourney')?.trim()
  if (!journeyId) return null
  const stepId = params.get('tmStep')?.trim()
  return stepId ? { journeyId, stepId } : { journeyId }
}

/** Convert a resolved fixture URL to a React Router destination when it is local. */
export function sameOriginAppPath(
  href: string,
  currentOrigin: string,
): string | null {
  try {
    const url = new URL(href, currentOrigin)
    if (url.origin !== currentOrigin) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

/**
 * Compare a product nickname with fixture aliases to offer a switching hint.
 * A nickname is not an account identifier; the tester must still verify email.
 */
export function fixtureNicknameState(
  displayName: string | null,
  aliases: string[],
): FixtureNicknameState {
  const required = aliases.filter(Boolean)
  if (!displayName || required.length === 0) return 'unknown'
  return required.includes(displayName) ? 'match' : 'mismatch'
}
