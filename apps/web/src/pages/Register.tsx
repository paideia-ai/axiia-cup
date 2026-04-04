import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/auth'
import { register as registerRequest } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'

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
    return <Navigate replace to="/dashboard" />
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
      navigate('/dashboard', { replace: true })
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : '注册失败',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <p className="mb-8 text-xs font-black tracking-[0.24em] text-(--accent)">
        AXIIA CUP
      </p>

      <div className="w-full max-w-sm space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-(--foreground)">
            注册
          </h1>
          {step === 'credentials' ? (
            <span className="text-xs text-(--foreground-muted)">
              第 2 步，共 2 步
            </span>
          ) : (
            <span className="text-xs text-(--foreground-muted)">
              第 1 步，共 2 步
            </span>
          )}
        </div>

        <Card>
          <CardContent className="pt-5">
            {step === 'email' ? (
              <form className="space-y-4" onSubmit={handleContinue}>
                <label className="block space-y-1.5 text-sm text-(--foreground-subtle)">
                  <span>邮箱</span>
                  <Input
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                  />
                </label>
                {error ? (
                  <p className="text-sm text-(--accent)">{error}</p>
                ) : null}
                <Button className="w-full" type="submit">
                  下一步
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block space-y-1.5 text-sm text-(--foreground-subtle)">
                  <span>邮箱</span>
                  <Input readOnly value={email} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1.5 text-sm text-(--foreground-subtle)">
                    <span>邀请码</span>
                    <Input
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="邀请码"
                      value={otp}
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm text-(--foreground-subtle)">
                    <span>显示名称</span>
                    <Input
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="momo"
                      value={displayName}
                    />
                  </label>
                </div>
                <label className="block space-y-1.5 text-sm text-(--foreground-subtle)">
                  <span>密码</span>
                  <Input
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="设置密码"
                    type="password"
                    value={password}
                  />
                </label>
                {error ? (
                  <p className="text-sm text-(--accent)">{error}</p>
                ) : null}
                <div className="flex gap-3">
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
                    {isSubmitting ? '创建中…' : '创建账户'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-(--foreground-muted)">
          已有账户？{' '}
          <Link to="/login" className="text-(--accent)">
            返回登录
          </Link>
        </p>
      </div>
    </div>
  )
}
