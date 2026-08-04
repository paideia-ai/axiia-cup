import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useAuth } from '../context/auth'
import { messageOf } from '../lib/use-async'

export function SettingsPage() {
  const { account, elevated, elevate } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!account) return null

  const submitElevate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await elevate(code)
      setCode('')
    } catch (cause) {
      setError(messageOf(cause, '提权失败'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='max-w-xl space-y-6'>
      <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
        账户
      </h1>

      <Card>
        <CardContent className='space-y-2 pt-5 text-sm'>
          <div className='flex justify-between'>
            <span className='text-(--foreground-muted)'>昵称</span>
            <span className='text-(--foreground)'>{account.displayName}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-(--foreground-muted)'>邮箱</span>
            <span className='text-(--foreground)'>{account.email ?? '—'}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-(--foreground-muted)'>角色</span>
            <span>
              {account.isAdmin
                ? <Badge tone='warning'>管理员</Badge>
                : <Badge tone='info'>选手</Badge>}
            </span>
          </div>
        </CardContent>
      </Card>

      {account.isAdmin
        ? (
          <Card>
            <CardContent className='space-y-3 pt-5'>
              <div className='flex items-center justify-between'>
                <h2 className='text-sm font-semibold text-(--foreground)'>
                  管理员提权
                </h2>
                {elevated
                  ? <Badge tone='success'>已提权</Badge>
                  : <Badge tone='accent'>未提权</Badge>}
              </div>
              {elevated
                ? (
                  <p className='text-sm text-(--foreground-subtle)'>
                    当前会话已提权。<Link
                      to='/admin'
                      className='text-(--accent)'
                    >
                      进入管理面板
                    </Link>
                  </p>
                )
                : (
                  <form
                    className='flex items-end gap-3'
                    onSubmit={submitElevate}
                  >
                    <label className='flex-1 space-y-1.5 text-sm text-(--foreground-subtle)'>
                      <span>TOTP 验证码 / 恢复码</span>
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder='123456'
                        inputMode='numeric'
                      />
                    </label>
                    <Button type='submit' disabled={busy || !code.trim()}>
                      {busy ? '验证中…' : '提权'}
                    </Button>
                  </form>
                )}
              {error
                ? <p className='text-sm text-(--accent)'>{error}</p>
                : null}
            </CardContent>
          </Card>
        )
        : null}
    </div>
  )
}
