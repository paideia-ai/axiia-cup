import { useEffect, useState } from 'react'

import { ApiError, auth } from '../../api/client'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { useAuth } from '../../context/auth'
import { messageOf } from '../../lib/use-async'
import { tm } from '../../testmode/mark'

const COOLDOWN_SECONDS = 60

export function BindPhoneCard() {
  const { account, bindPhone } = useAuth()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (remaining <= 0) return
    const timer = setTimeout(() => setRemaining(remaining - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining])

  if (!account) return null

  const send = async () => {
    setError(null)
    setBusy(true)
    try {
      await auth.sendBindCode({ phone })
      setSent(true)
      setRemaining(COOLDOWN_SECONDS)
    } catch (cause) {
      if (cause instanceof ApiError && cause.retryAfter) {
        setRemaining(COOLDOWN_SECONDS)
      }
      setError(messageOf(cause, '验证码发送失败'))
    } finally {
      setBusy(false)
    }
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await bindPhone({ phone, code })
      setPhone('')
      setCode('')
      setSent(false)
    } catch (cause) {
      setError(messageOf(cause, '绑定失败'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card {...tm('K.bind-phone-card')}>
      <CardContent className='space-y-3 pt-5'>
        <h2 className='text-sm font-semibold text-(--foreground)'>
          {account.phone ? '更换手机号' : '绑定手机号'}
        </h2>
        <p className='text-xs text-(--foreground-muted)'>
          绑定后可用手机号验证码登录。
        </p>
        <form className='space-y-3' onSubmit={submit}>
          <div className='flex gap-2'>
            <Input
              aria-label='手机号'
              autoComplete='tel'
              inputMode='numeric'
              name='phone'
              {...tm('K.bind-phone-input')}
              onChange={(e) => setPhone(e.target.value)}
              placeholder='中国大陆手机号'
              value={phone}
            />
            <Button
              className='shrink-0'
              disabled={busy || remaining > 0 || phone.length < 11}
              {...tm('K.bind-send-code-button')}
              onClick={send}
              type='button'
              variant='secondary'
            >
              {remaining > 0 ? `${remaining}s` : '发送验证码'}
            </Button>
          </div>
          {sent
            ? (
              <Input
                aria-label='验证码'
                autoComplete='one-time-code'
                inputMode='numeric'
                maxLength={6}
                name='code'
                {...tm('K.bind-code-input')}
                onChange={(e) => setCode(e.target.value)}
                placeholder='6 位验证码'
                value={code}
              />
            )
            : null}
          {error
            ? (
              <p className='text-sm text-(--accent)' {...tm('K.bind-error')}>
                {error}
              </p>
            )
            : null}
          <Button
            disabled={busy || !sent || code.length < 6}
            type='submit'
            {...tm('K.bind-submit-button')}
          >
            {busy ? '处理中…' : '确认绑定'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
