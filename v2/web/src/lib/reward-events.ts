export const REWARDS_CHANGED = 'axiia:rewards-changed'

export function refreshRewards() {
  globalThis.dispatchEvent?.(new Event(REWARDS_CHANGED))
}
