import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { IcpRecord } from '../components/layout/icp-record'
import { useAuth } from '../context/auth'
import { tm } from '../testmode/mark'

export function RegisterPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [code, setCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const me = await signup({
        code,
        displayName,
        email: email || null,
        password,
        phone: null,
      })
      // A3：注册（自动登录）后未打过首战 → 直落快速通道；否则照旧进场景。
      navigate(me.firstBattleDone === true ? '/scenarios' : '/express', {
        replace: true,
      })
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : '注册失败',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='flex min-h-screen flex-col px-4 py-12'>
      <div className='flex flex-1 items-center justify-center'>
        <div className='w-full max-w-sm space-y-5'>
          <h1
            {...tm('C.page-title')}
            className='flex justify-center text-3xl font-black tracking-tight text-(--foreground)'
          >
            注册
          </h1>
          <Card>
            <CardContent className='pt-5'>
              <form
                {...tm('C.form')}
                className='space-y-4'
                onSubmit={handleSubmit}
              >
                <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
                  <span>注册码</span>
                  <Input
                    {...tm('C.code-input')}
                    name='code'
                    onChange={(e) => setCode(e.target.value)}
                    placeholder='邀请注册码'
                    value={code}
                  />
                  <span
                    {...tm('C.code-hint')}
                    className='text-xs text-(--foreground-muted)'
                  >
                    从群聊或活动页面获取
                  </span>
                </label>
                <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
                  <span>昵称</span>
                  <Input
                    {...tm('C.display-name-input')}
                    name='displayName'
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder='你的名字'
                    value={displayName}
                  />
                </label>
                <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
                  <span>邮箱</span>
                  <Input
                    {...tm('C.email-input')}
                    autoComplete='email'
                    name='email'
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='you@example.com'
                    type='email'
                    value={email}
                  />
                </label>
                <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
                  <span>密码</span>
                  <Input
                    {...tm('C.password-input')}
                    autoComplete='new-password'
                    name='password'
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='至少 8 位'
                    type='password'
                    value={password}
                  />
                </label>
                {error
                  ? (
                    <p {...tm('C.error')} className='text-sm text-(--accent)'>
                      {error}
                    </p>
                  )
                  : null}
                <Button
                  {...tm('C.submit-button')}
                  className='w-full'
                  disabled={isSubmitting}
                  type='submit'
                >
                  {isSubmitting ? '注册中…' : '创建账户'}
                </Button>
              </form>
            </CardContent>
          </Card>
          <p className='text-center text-sm text-(--foreground-muted)'>
            已有账户？{' '}
            <Link
              {...tm('C.login-link')}
              to='/login'
              className='text-(--accent)'
            >
              去登录
            </Link>
          </p>
        </div>
      </div>
      <IcpRecord className='mt-8' />
    </div>
  )
}
