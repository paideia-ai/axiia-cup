/** Static mock: Register page (step 2 — credentials) */
import { Link } from 'react-router-dom'

import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { IcpRecord } from '../../components/layout/icp-record'

export function MockRegister() {
  return (
    <div className="flex min-h-screen flex-col px-4 py-12">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm space-y-5">
          <div className="flex items-center justify-center">
            <h1 className="text-3xl font-black tracking-tight text-(--foreground)">
              注册
            </h1>
          </div>

          <Card>
            <CardContent className="pt-5">
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <label className="block space-y-1.5 text-sm text-(--foreground-subtle)">
                  <span>邮箱</span>
                  <Input readOnly value="alice@example.com" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1.5 text-sm text-(--foreground-subtle)">
                    <span>邀请码</span>
                    <Input placeholder="邀请码" />
                    <span className="text-xs text-(--foreground-muted)">
                      从群聊或活动页面获取
                    </span>
                  </label>
                  <label className="block space-y-1.5 text-sm text-(--foreground-subtle)">
                    <span>显示名称</span>
                    <Input placeholder="momo" />
                  </label>
                </div>
                <label className="block space-y-1.5 text-sm text-(--foreground-subtle)">
                  <span>密码</span>
                  <Input placeholder="设置密码" type="password" />
                </label>
                <div className="flex gap-3">
                  <Button type="button" variant="secondary">
                    返回
                  </Button>
                  <Button className="flex-1" type="submit">
                    创建账户
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-(--foreground-muted)">
            已有账户？{' '}
            <Link to="/mocks/login" className="text-(--accent)">
              返回登录
            </Link>
          </p>
        </div>
      </div>
      <IcpRecord className="mt-8" />
    </div>
  )
}
