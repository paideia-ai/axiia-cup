import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useAuth } from '../context/auth'
import { changePassword, updateProfile } from '../lib/api'

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium uppercase tracking-[0.1em] text-(--foreground-muted)">
      {children}
    </span>
  )
}

export function SettingsPage() {
  const { updateUser, user } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileNotice, setProfileNotice] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordNotice, setPasswordNotice] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    setDisplayName(user?.displayName ?? '')
  }, [user?.displayName])

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileError('')
    setProfileNotice('')
    setIsSavingProfile(true)

    try {
      const nextUser = await updateProfile({ displayName })
      updateUser(nextUser)
      setProfileNotice('显示名称已更新。')
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : '更新显示名称失败',
      )
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError('')
    setPasswordNotice('')
    setIsChangingPassword(true)

    try {
      await changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setPasswordNotice('密码已更新。')
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : '修改密码失败')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="page-eyebrow">账户</p>
        <h1 className="page-title">设置</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleProfileSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <FieldLabel>显示名称</FieldLabel>
                <Input
                  onChange={(e) => setDisplayName(e.target.value)}
                  value={displayName}
                />
              </label>
              <label className="block space-y-1.5">
                <FieldLabel>邮箱</FieldLabel>
                <Input disabled value={user?.email ?? ''} />
              </label>
            </div>
            {(profileError || profileNotice) && (
              <p
                className={`text-sm ${profileError ? 'text-(--accent)' : 'text-(--success)'}`}
              >
                {profileError || profileNotice}
              </p>
            )}
            <Button disabled={isSavingProfile} type="submit">
              {isSavingProfile ? '保存中…' : '保存'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handlePasswordSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <FieldLabel>当前密码</FieldLabel>
                <Input
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="输入当前密码"
                  type="password"
                  value={currentPassword}
                />
              </label>
              <label className="block space-y-1.5">
                <FieldLabel>新密码</FieldLabel>
                <Input
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="输入新密码"
                  type="password"
                  value={newPassword}
                />
              </label>
            </div>
            {(passwordError || passwordNotice) && (
              <p
                className={`text-sm ${passwordError ? 'text-(--accent)' : 'text-(--success)'}`}
              >
                {passwordError || passwordNotice}
              </p>
            )}
            <Button disabled={isChangingPassword} type="submit">
              {isChangingPassword ? '更新中…' : '更新密码'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
