import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/auth'
import { login as loginRequest } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { IcpRecord } from '../components/layout/icp-record'

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
    <div className="flex min-h-screen flex-col px-4 py-12">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm space-y-5">
          <h1 className="flex justify-center text-3xl font-black tracking-tight text-(--foreground)">
            登录
          </h1>

          <Card>
            <CardContent className="pt-5">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block space-y-1.5 text-sm text-(--foreground-subtle)">
                  <span>邮箱</span>
                  <Input
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                  />
                </label>
                <label className="block space-y-1.5 text-sm text-(--foreground-subtle)">
                  <span>密码</span>
                  <Input
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    type="password"
                    value={password}
                  />
                </label>
                {error ? (
                  <p className="text-sm text-(--accent)">{error}</p>
                ) : null}
                <Button
                  className="w-full"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? '登录中…' : '登录'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-(--foreground-muted)">
            还没有账户？{' '}
            <Link to="/register" className="text-(--accent)">
              去注册
            </Link>
          </p>
        </div>
      </div>

      <IcpRecord className="mt-8" />
    </div>
  )
}
