import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/auth'
import { login as loginRequest } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export function LoginPage() {
  const navigate = useNavigate()
  const { isLoading, login, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isLoading && user) {
    return <Navigate replace to="/scenarios" />
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await loginRequest({ email, password })
      login(response)
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>登录</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
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
            <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
              <span>密码</span>
              <input
                className="app-input"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                type="password"
                value={password}
              />
            </label>
            {error ? <p className="text-sm text-[#f87171]">{error}</p> : null}
            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? '登录中...' : '进入控制台'}
            </Button>
          </form>
          <p className="mt-4 text-sm text-[var(--foreground-muted)]">
            还没有账户？{' '}
            <Link to="/register" className="text-[var(--accent)]">
              去注册
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
