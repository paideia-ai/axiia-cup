import { useEffect, useState } from 'react'

import { ApiError, auth } from '../../api/client'
import type { MeResponse } from '../../api/types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useAuth } from '../../context/auth'
import { messageOf } from '../../lib/use-async'

const COOLDOWN_SECONDS = 60

function useCooldown() {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (remaining <= 0) return
    const timer = setTimeout(() => setRemaining(remaining - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining])

  return { remaining, start: () => setRemaining(COOLDOWN_SECONDS) }
}

type Props = {
  onDone: (me: MeResponse) => void
  // 注册页要注册码与昵称；登录页只要号码与验证码。
  withInvite: boolean
}

export function PhoneAuthForm({ onDone, withInvite }: Props) {
  const { verifyPhone } = useAuth()
  const cooldown = useCooldown()
  const [phone, setPhone] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [needsName, setNeedsName] = useState(withInvite)
  const [error, setError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  const send = async () => {
    setError(null)
    setIsBusy(true)
    try {
      const outcome = await auth.sendPhoneCode({
        phone,
        inviteCode: inviteCode || null,
      })
      setNeedsName(!outcome.registered)
      setSent(true)
      cooldown.start()
    } catch (cause) {
      // Retry-After 是服务端为这个号算出的预算；照它起倒计时，才不会怂恿一次
      // 注定被拒的重发。
      if (cause instanceof ApiError && cause.retryAfter) cooldown.start()
      setError(messageOf(cause, '验证码发送失败'))
    } finally {
      setIsBusy(false)
    }
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsBusy(true)
    try {
      onDone(
        await verifyPhone({
          phone,
          code,
          displayName: needsName ? displayName : null,
        }),
      )
    } catch (cause) {
      setError(messageOf(cause, '验证失败'))
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <form className='space-y-4' onSubmit={submit}>
      {withInvite
        ? (
          <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
            <span>注册码</span>
            <Input
              name='inviteCode'
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder='邀请注册码'
              value={inviteCode}
            />
            <span className='text-xs text-(--foreground-muted)'>
              从群聊或活动页面获取
            </span>
          </label>
        )
        : null}
      <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
        <span>手机号</span>
        <div className='flex gap-2'>
          <Input
            autoComplete='tel'
            inputMode='numeric'
            name='phone'
            onChange={(e) => setPhone(e.target.value)}
            placeholder='中国大陆手机号'
            value={phone}
          />
          <Button
            className='shrink-0'
            disabled={isBusy || cooldown.remaining > 0 || phone.length < 11}
            onClick={send}
            type='button'
            variant='secondary'
          >
            {cooldown.remaining > 0 ? `${cooldown.remaining}s` : '发送验证码'}
          </Button>
        </div>
      </label>
      {sent
        ? (
          <>
            <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
              <span>验证码</span>
              <Input
                autoComplete='one-time-code'
                inputMode='numeric'
                maxLength={6}
                name='code'
                onChange={(e) => setCode(e.target.value)}
                placeholder='6 位数字'
                value={code}
              />
            </label>
            {needsName
              ? (
                <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
                  <span>昵称</span>
                  <Input
                    name='displayName'
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder='你的名字'
                    value={displayName}
                  />
                </label>
              )
              : null}
          </>
        )
        : null}
      {error ? <p className='text-sm text-(--accent)'>{error}</p> : null}
      <Button
        className='w-full'
        disabled={isBusy || !sent || code.length < 6}
        type='submit'
      >
        {isBusy ? '处理中…' : needsName ? '创建账户' : '登录'}
      </Button>
    </form>
  )
}
