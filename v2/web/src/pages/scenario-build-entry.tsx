import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { agentEntryUrl } from '../lib/agent-entry'

export function ScenarioBuildEntry() {
  const { scenarioId = '' } = useParams()
  const [search] = useSearchParams()
  const side = search.get('side')
  return (
    <Navigate
      replace
      to={side === 'a' || side === 'b'
        ? agentEntryUrl(scenarioId, side)
        : `/scenarios/${encodeURIComponent(scenarioId)}`}
    />
  )
}
