import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { IcpRecord } from '../components/layout/icp-record'
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
            {...tm('B.page-title')}
            className='flex justify-center text-3xl font-black tracking-tight text-(--foreground)'
          >
            登录
          </h1>
          <Card>
            <CardContent className='pt-5'>
              <form
                {...tm('B.form')}
                className='space-y-4'
                onSubmit={handleSubmit}
              >
                <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
                  <span>邮箱</span>
                  <Input
                    {...tm('B.email-input')}
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
                    {...tm('B.password-input')}
                    autoComplete='current-password'
                    name='password'
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='••••••••'
                    type='password'
                    value={password}
                  />
                </label>
                {error
                  ? (
                    <p {...tm('B.error')} className='text-sm text-(--accent)'>
                      {error}
                    </p>
                  )
                  : null}
                <Button
                  {...tm('B.submit-button')}
                  className='w-full'
                  disabled={isSubmitting}
                  type='submit'
                >
                  {isSubmitting ? '登录中…' : '登录'}
                </Button>
              </form>
            </CardContent>
          </Card>
          <p className='text-center text-sm text-(--foreground-muted)'>
            还没有账户？{' '}
            <Link
              {...tm('B.register-link')}
              to='/register'
              className='text-(--accent)'
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
