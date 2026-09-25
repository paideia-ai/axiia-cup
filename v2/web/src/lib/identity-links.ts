export function positiveID(value: string | null): number | undefined {
  if (value == null || !/^\d+$/.test(value)) return undefined
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : undefined
}

export function npcIdentityPath(
  scenarioID: string,
  presetKey: string,
  matchID: number,
) {
  return `/scenarios/${encodeURIComponent(scenarioID)}/npcs/${
    encodeURIComponent(presetKey)
  }?match=${matchID}`
}
