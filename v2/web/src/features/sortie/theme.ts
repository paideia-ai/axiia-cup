import { scenarioModule } from '../../scenarios'

export { colors } from './scenario-themes'

export function sortieArtwork(scenarioID: string) {
  const module = scenarioModule(scenarioID)
  return (scenarioID === 'trolley-problem'
    ? module?.overviewFactImages?.['案件二：自动驾驶车']
    : null) ??
    module?.overviewImages?.[0] ??
    Object.values(module?.overviewFactImages ?? {})[0]
}
