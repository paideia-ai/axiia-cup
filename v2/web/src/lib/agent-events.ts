export interface EntryMutation {
  agentID: number
  token: symbol
  versionID: number
}

type Listener = () => void

let activeEntryMutation: EntryMutation | null = null
const entryListeners = new Set<Listener>()
const agentListeners = new Set<Listener>()

function notify(listeners: Set<Listener>) {
  for (const listener of listeners) listener()
}

// The tournament entry slot is side-wide. A module-scoped coordinator survives
// route unmount/remount, preventing two agent homes from issuing reversed entry
// writes while the first request is still in flight.
export function beginEntryMutation(
  agentID: number,
  versionID: number,
): symbol | null {
  if (activeEntryMutation != null) return null
  const token = Symbol('entry-mutation')
  activeEntryMutation = { agentID, token, versionID }
  notify(entryListeners)
  return token
}

export function finishEntryMutation(token: symbol) {
  if (activeEntryMutation?.token !== token) return
  activeEntryMutation = null
  notify(entryListeners)
}

export function getEntryMutation(): EntryMutation | null {
  return activeEntryMutation
}

export function subscribeEntryMutation(listener: Listener): () => void {
  entryListeners.add(listener)
  return () => entryListeners.delete(listener)
}

// Inventory/name/entry mutations can resolve after their source page unmounts.
// Consumers subscribe here so a completion invalidates whichever projection is
// visible now instead of leaving it stale until a manual refresh.
export function notifyAgentsChanged() {
  notify(agentListeners)
}

export function subscribeAgentsChanged(listener: Listener): () => void {
  agentListeners.add(listener)
  return () => agentListeners.delete(listener)
}
