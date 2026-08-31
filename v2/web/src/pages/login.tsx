import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { IcpRecord } from '../components/layout/icp-record'
import { PhoneAuthForm } from '../components/auth/phone-form'
import { useAuth } from '../context/auth'
import { tm } from '../testmode/mark'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login({ email, password })
      navigate('/scenarios', { replace: true })
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : '登录失败',
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
            {...tm('B.page-title')}
          >
            登录
          </h1>
          <Card {...tm('B.auth-card')}>
            <CardContent className='pt-5'>
              <Tabs defaultValue='email'>
                <TabsList className='mb-4'>
                  <TabsTrigger value='phone'>手机号</TabsTrigger>
                  <TabsTrigger value='email'>邮箱</TabsTrigger>
                </TabsList>
                <TabsContent value='phone'>
                  <PhoneAuthForm
                    onDone={() => navigate('/scenarios', { replace: true })}
                    withInvite={false}
                  />
                </TabsContent>
                <TabsContent value='email'>
                  <form
                    className='space-y-4'
                    onSubmit={handleSubmit}
                    {...tm('B.form')}
                  >
                    <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
                      <span>邮箱</span>
                      <Input
                        autoComplete='email'
                        name='email'
                        {...tm('B.email-input')}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder='you@example.com'
                        type='email'
                        value={email}
                      />
                    </label>
                    <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
                      <span>密码</span>
                      <Input
                        autoComplete='current-password'
                        name='password'
                        {...tm('B.password-input')}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder='••••••••'
                        type='password'
                        value={password}
                      />
                    </label>
                    {error
                      ? (
                        <p
                          className='text-sm text-(--accent)'
                          {...tm('B.error')}
                        >
                          {error}
                        </p>
                      )
                      : null}
                    <Button
                      className='w-full'
                      disabled={isSubmitting}
                      type='submit'
                      {...tm('B.submit-button')}
                    >
                      {isSubmitting ? '登录中…' : '登录'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <p className='text-center text-sm text-(--foreground-muted)'>
            还没有账户？{' '}
            <Link
              to='/register'
              className='text-(--accent)'
              {...tm('B.register-link')}
            >
              去注册
            </Link>
          </p>
        </div>
      </div>
      <IcpRecord className='mt-8' />
    </div>
  )
}
