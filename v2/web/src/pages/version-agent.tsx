import { Link, Navigate, useParams } from 'react-router-dom'

import { versions } from '../api/client'
import { Button } from '../components/ui/button'
import { useAsync } from '../lib/use-async'

// Standings identify the versions submitted to that tournament. Resolve only
// the clicked version; its id is not the id of its owning agent.
export function VersionAgentPage() {
  const { versionId = '' } = useParams()
  const id = Number(versionId)
  const valid = Number.isSafeInteger(id) && id > 0
  const { data, loading, error, reload } = useAsync(async () => {
    if (!valid) throw new Error('invalid version')
    const ref = await versions.ref(id, AbortSignal.timeout(3000))
    if (
      ref.versionID !== id || !Number.isSafeInteger(ref.agentID) ||
      ref.agentID <= 0
    ) throw new Error('invalid version reference')
    return ref
  }, [id, valid])

  if (!loading && error) {
    return (
      <div className='space-y-4'>
        <p role='alert'>暂时无法打开该版本所属的智能体。</p>
        <div className='flex items-center gap-4'>
          {valid && <Button onClick={reload}>重试</Button>}
          <Link to='/tournaments' className='text-sm underline'>
            返回锦标赛
          </Link>
        </div>
      </div>
    )
  }

  if (!loading && data?.versionID === id) {
    return <Navigate replace to={`/agents/${data.agentID}`} />
  }

  return <p role='status' className='text-sm'>正在打开智能体…</p>
}
