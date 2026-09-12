// Only current catalog entrances use this URL. A historical match must resolve
// its pinned configuration instead of linking to a possibly replaced preset.
export function currentNpcPath(scenarioID: string, presetKey: string) {
  return `/scenarios/${encodeURIComponent(scenarioID)}/npcs/${
    encodeURIComponent(presetKey)
  }`
}
