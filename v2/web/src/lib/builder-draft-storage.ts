const JOURNAL_V2_PREFIX = 'axiia:builder-draft:v2'
const LEGACY_JOURNAL_V1_PREFIX = 'axiia:builder-draft:v1'

const draftMutationTails = new Map<string, Promise<void>>()

export function builderDraftJournalIdentity(
  accountID: string | null | undefined,
  agentID: number,
) {
  return `${accountID ?? 'anonymous'}:${agentID}`
}

export function builderDraftJournalStoragePrefix(identity: string) {
  return `${JOURNAL_V2_PREFIX}:${encodeURIComponent(identity)}:`
}

// Mutations are serialized outside React so a keyed Builder unmount/remount
// cannot create a second queue for the same account+agent and overtake an old
// delayed POST. Failures release the lane; the next mutation still gets a turn.
export function enqueueBuilderDraftMutation(
  identity: string,
  mutation: () => Promise<void>,
) {
  const previous = draftMutationTails.get(identity) ?? Promise.resolve()
  const next = previous.catch(() => {}).then(mutation)
  draftMutationTails.set(identity, next)
  void next.then(
    () => {
      if (draftMutationTails.get(identity) === next) {
        draftMutationTails.delete(identity)
      }
    },
    () => {
      if (draftMutationTails.get(identity) === next) {
        draftMutationTails.delete(identity)
      }
    },
  )
  return next
}

// Agent IDs are globally owned. After the server confirms deletion, erase every
// v2 token record carrying that exact ID, regardless of which account-scoped
// identity wrote it, plus the pre-v2 single-key journal. Malformed/unrelated
// localStorage entries are left untouched.
export function purgeBuilderDraftJournals(agentID: number) {
  try {
    const keys: string[] = []
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (key == null) continue
      if (key === `${LEGACY_JOURNAL_V1_PREFIX}:${agentID}`) {
        keys.push(key)
        continue
      }
      if (!key.startsWith(`${JOURNAL_V2_PREFIX}:`)) continue
      const raw = localStorage.getItem(key)
      if (raw == null) continue
      try {
        const value = JSON.parse(raw) as { agentID?: unknown }
        if (value.agentID === agentID) keys.push(key)
      } catch {
        // Do not erase an unrelated malformed application value by guessing.
      }
    }
    for (const key of keys) localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}
