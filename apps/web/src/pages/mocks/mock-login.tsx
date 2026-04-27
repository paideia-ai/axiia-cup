/** Static mock: Login page */
import { Link } from 'react-router-dom'

import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { IcpRecord } from '../../components/layout/icp-record'

export function MockLogin() {
  return (
    <div className="flex min-h-screen flex-col px-4 py-12">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm space-y-5">
          <h1 className="flex justify-center text-3xl font-black tracking-tight text-(--foreground)">
            登录
          </h1>

          <Card>
            <CardContent className="pt-5">
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <label className="block space-y-1.5 text-sm text-(--foreground-subtle)">
                  <span>邮箱</span>
                  <Input placeholder="you@example.com" type="email" />
                </label>
                <label className="block space-y-1.5 text-sm text-(--foreground-subtle)">
                  <span>密码</span>
                  <Input placeholder="••••••••" type="password" />
                </label>
                <Button className="w-full" type="submit">
                  登录
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-(--foreground-muted)">
            还没有账户？{' '}
            <Link to="/mocks/register" className="text-(--accent)">
              去注册
            </Link>
          </p>
        </div>
      </div>
      <IcpRecord className="mt-8" />
    </div>
  )
}
