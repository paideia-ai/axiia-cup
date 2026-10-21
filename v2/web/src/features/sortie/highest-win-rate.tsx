import { Crown } from 'lucide-react'
import { Link } from 'react-router-dom'

export function HighestWinRate(
  { value, agentID }: { value: string; agentID?: number | null },
) {
  return (
    <div className='sortie-linked-record'>
      <span>
        <Crown size={14} />全服最高胜率
      </span>
      <strong>{value}</strong>
      {agentID != null && (
        <Link
          className='sortie-record-link'
          to={`/agents/${agentID}/identity`}
          aria-label={`全服最高胜率 ${value}，查看智能体`}
          title='查看智能体'
        />
      )}
    </div>
  )
}
