import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="page-eyebrow">Settings</p>
        <h1 className="page-title">设置</h1>
        <p className="page-subtitle">用户资料页面先收一层，后面再接 display name、密码修改和会话管理。</p>
      </div>
      <Card className="max-w-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>账户信息</CardTitle>
          <Badge tone="info">JWT / Session 待接入</Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
            <span>显示名称</span>
            <input className="app-input" defaultValue="momo" />
          </label>
          <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
            <span>邮箱</span>
            <input className="app-input" defaultValue="momo@axiia.local" />
          </label>
          <div className="md:col-span-2">
            <Button>保存</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
