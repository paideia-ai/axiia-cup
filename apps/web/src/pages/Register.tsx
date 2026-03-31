import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/auth'
import { register as registerRequest } from '../lib/api'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

type RegisterStep = 'email' | 'credentials'

export function RegisterPage() {
  const navigate = useNavigate()
  const { isLoading, login, user } = useAuth()
  const [step, setStep] = useState<RegisterStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isLoading && user) {
    return <Navigate replace to="/scenarios" />
  }

  const handleContinue = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('请输入邮箱')
      return
    }

    setStep('credentials')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await registerRequest({
        displayName: displayName.trim() || undefined,
        email,
        otp,
        password,
      })
      login(response)
      navigate('/scenarios', { replace: true })
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : '注册失败',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>注册</CardTitle>
          <Badge>固定 OTP: 123456</Badge>
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            <form className="space-y-4" onSubmit={handleContinue}>
              <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
                <span>邮箱</span>
                <input
                  className="app-input"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                />
              </label>
              {error ? <p className="text-sm text-[#f87171]">{error}</p> : null}
              <Button className="w-full" type="submit">
                下一步
              </Button>
            </form>
          ) : (
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <label className="block space-y-2 text-sm text-[var(--foreground-subtle)] md:col-span-2">
                <span>邮箱</span>
                <input className="app-input" readOnly value={email} />
              </label>
              <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
                <span>验证码</span>
                <input
                  className="app-input"
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="123456"
                  value={otp}
                />
              </label>
              <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
                <span>显示名称</span>
                <input
                  className="app-input"
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="momo"
                  value={displayName}
                />
              </label>
              <label className="block space-y-2 text-sm text-[var(--foreground-subtle)] md:col-span-2">
                <span>密码</span>
                <input
                  className="app-input"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="设置密码"
                  type="password"
                  value={password}
                />
              </label>
              {error ? (
                <p className="text-sm text-[#f87171] md:col-span-2">{error}</p>
              ) : null}
              <div className="flex gap-3 md:col-span-2">
                <Button
                  disabled={isSubmitting}
                  type="button"
                  variant="secondary"
                  onClick={() => setStep('email')}
                >
                  返回
                </Button>
                <Button
                  className="flex-1"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? '创建中...' : '创建账户'}
                </Button>
              </div>
            </form>
          )}
          <p className="mt-4 text-sm text-[var(--foreground-muted)]">
            已有账户？{' '}
            <Link to="/login" className="text-[var(--accent)]">
              返回登录
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
