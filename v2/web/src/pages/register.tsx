import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { IcpRecord } from '../components/layout/icp-record'
import { PhoneAuthForm } from '../components/auth/phone-form'
import type { MeResponse } from '../api/types'
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

  // A3：注册（自动登录）后未打过首战 → 直落快速通道；否则照旧进场景。手机号
  // 一路可能是登录也可能是开号，落点判据相同。
  const land = (me: MeResponse) => {
    navigate(me.firstBattleDone === true ? '/scenarios' : '/express', {
      replace: true,
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      land(
        await signup({
          code,
          displayName,
          email: email || null,
          password,
          phone: null,
        }),
      )
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
            className='flex justify-center text-3xl font-black tracking-tight text-(--foreground)'
            {...tm('C.page-title')}
          >
            注册
          </h1>
          <Card {...tm('C.auth-card')}>
            <CardContent className='pt-5'>
              <Tabs defaultValue='email'>
                <TabsList className='mb-4'>
                  <TabsTrigger value='phone'>手机号</TabsTrigger>
                  <TabsTrigger value='email'>邮箱</TabsTrigger>
                </TabsList>
                <TabsContent value='phone'>
                  <PhoneAuthForm onDone={land} withInvite />
                </TabsContent>
                <TabsContent value='email'>
                  <form
                    className='space-y-4'
                    onSubmit={handleSubmit}
                    {...tm('C.form')}
                  >
                    <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
                      <span>注册码</span>
                      <Input
                        name='code'
                        {...tm('C.code-input')}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder='邀请注册码'
                        value={code}
                      />
                      <span
                        className='text-xs text-(--foreground-muted)'
                        {...tm('C.code-hint')}
                      >
                        从群聊或活动页面获取
                      </span>
                    </label>
                    <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
                      <span>昵称</span>
                      <Input
                        name='displayName'
                        {...tm('C.display-name-input')}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder='你的名字'
                        value={displayName}
                      />
                    </label>
                    <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
                      <span>邮箱</span>
                      <Input
                        autoComplete='email'
                        name='email'
                        {...tm('C.email-input')}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder='you@example.com'
                        type='email'
                        value={email}
                      />
                    </label>
                    <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
                      <span>密码</span>
                      <Input
                        autoComplete='new-password'
                        name='password'
                        {...tm('C.password-input')}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder='至少 8 位'
                        type='password'
                        value={password}
                      />
                    </label>
                    {error
                      ? (
                        <p
                          className='text-sm text-(--accent)'
                          {...tm('C.error')}
                        >
                          {error}
                        </p>
                      )
                      : null}
                    <Button
                      className='w-full'
                      disabled={isSubmitting}
                      type='submit'
                      {...tm('C.submit-button')}
                    >
                      {isSubmitting ? '注册中…' : '创建账户'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <p className='text-center text-sm text-(--foreground-muted)'>
            已有账户？{' '}
            <Link
              to='/login'
              className='text-(--accent)'
              {...tm('C.login-link')}
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
