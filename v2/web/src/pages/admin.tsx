import { useState } from 'react'
import { Link } from 'react-router-dom'

import { admin } from '../api/client'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useAuth } from '../context/auth'
import { messageOf, useAsync } from '../lib/use-async'

function statusTone(status: string) {
  if (status === 'live') return 'success' as const
  if (status === 'retired') return 'info' as const
  return 'warning' as const
}

function SlotsCard() {
  const { data, error, loading } = useAsync(() => admin.slots(), [])

  return (
    <Card>
      <CardContent className='space-y-3 pt-5'>
        <h2 className='text-sm font-semibold text-(--foreground)'>场景槽位</h2>
        {loading && !data
          ? <p className='text-sm text-(--foreground-subtle)'>加载中…</p>
          : error
          ? <p className='text-sm text-(--accent)'>{error}</p>
          : data && data.slots.length === 0
          ? <p className='text-sm text-(--foreground-subtle)'>暂无槽位。</p>
          : (
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[36rem] text-left text-sm'>
                <thead className='text-xs text-(--foreground-muted)'>
                  <tr>
                    <th className='py-2 pr-3 font-medium'>ID</th>
                    <th className='py-2 pr-3 font-medium'>标题</th>
                    <th className='py-2 pr-3 font-medium'>状态</th>
                    <th className='py-2 font-medium'>脚本</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-(--border-soft)'>
                  {data?.slots.map((slot) => (
                    <tr key={slot.id}>
                      <td className='py-2.5 pr-3'>
                        <Link
                          to={`/admin/slots/${encodeURIComponent(slot.id)}`}
                          className='font-mono text-xs text-(--accent)'
                        >
                          {slot.id}
                        </Link>
                      </td>
                      <td className='py-2.5 pr-3 text-(--foreground)'>
                        {slot.title}
                      </td>
                      <td className='py-2.5 pr-3'>
                        <Badge tone={statusTone(slot.status)}>
                          {slot.status}
                        </Badge>
                      </td>
                      <td className='py-2.5 font-mono text-xs text-(--foreground-muted)'>
                        {slot.scriptSHA.slice(0, 12)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </CardContent>
    </Card>
  )
}

function RegistrationCodeCard() {
  const [code, setCode] = useState('')
  const [uses, setUses] = useState('10')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus(null)
    setError(null)
    try {
      await admin.createRegistrationCode({ code, uses: Number(uses) })
      setStatus(`注册码 ${code} 已创建（${uses} 次）`)
      setCode('')
    } catch (cause) {
      setError(messageOf(cause, '创建失败'))
    }
  }

  return (
    <Card>
      <CardContent className='space-y-3 pt-5'>
        <h2 className='text-sm font-semibold text-(--foreground)'>注册码</h2>
        <form className='flex flex-wrap items-end gap-3' onSubmit={submit}>
          <label className='space-y-1.5 text-sm text-(--foreground-subtle)'>
            <span className='block'>注册码</span>
            <Input value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
          <label className='space-y-1.5 text-sm text-(--foreground-subtle)'>
            <span className='block'>可用次数</span>
            <Input
              className='w-28'
              type='number'
              value={uses}
              onChange={(e) => setUses(e.target.value)}
            />
          </label>
          <Button type='submit' disabled={!code.trim()}>
            创建
          </Button>
        </form>
        {status ? <p className='text-sm text-(--success)'>{status}</p> : null}
        {error ? <p className='text-sm text-(--accent)'>{error}</p> : null}
      </CardContent>
    </Card>
  )
}

export function AdminPage() {
  const { elevated } = useAuth()

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
        管理面板
      </h1>

      {!elevated
        ? (
          <Card>
            <CardContent className='pt-5 text-sm text-(--foreground-subtle)'>
              管理操作需要先提权。前往{' '}
              <Link to='/settings' className='text-(--accent)'>
                账户设置
              </Link>{' '}
              输入 TOTP 验证码。
            </CardContent>
          </Card>
        )
        : (
          <>
            <SlotsCard />
            <RegistrationCodeCard />
          </>
        )}
    </div>
  )
}
