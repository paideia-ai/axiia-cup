import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { useAuth } from '../context/auth'
import { changePassword, updateProfile } from '../lib/api'

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

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={handleProfileSubmit}
          >
            <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
              <span>显示名称</span>
              <input
                className="app-input"
                onChange={(event) => setDisplayName(event.target.value)}
                value={displayName}
              />
            </label>
            <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
              <span>邮箱</span>
              <input
                className="app-input cursor-not-allowed opacity-70"
                disabled
                value={user?.email ?? ''}
              />
            </label>
            {(profileError || profileNotice) && (
              <p
                className={`md:col-span-2 text-sm ${profileError ? 'text-[var(--accent)]' : 'text-emerald-300'}`}
              >
                {profileError || profileNotice}
              </p>
            )}
            <div className="md:col-span-2">
              <Button disabled={isSavingProfile} type="submit">
                {isSavingProfile ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={handlePasswordSubmit}
          >
            <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
              <span>当前密码</span>
              <input
                className="app-input"
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="输入当前密码"
                type="password"
                value={currentPassword}
              />
            </label>
            <label className="block space-y-2 text-sm text-[var(--foreground-subtle)]">
              <span>新密码</span>
              <input
                className="app-input"
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="输入新密码"
                type="password"
                value={newPassword}
              />
            </label>
            {(passwordError || passwordNotice) && (
              <p
                className={`md:col-span-2 text-sm ${passwordError ? 'text-[var(--accent)]' : 'text-emerald-300'}`}
              >
                {passwordError || passwordNotice}
              </p>
            )}
            <div className="md:col-span-2">
              <Button disabled={isChangingPassword} type="submit">
                {isChangingPassword ? '更新中...' : '更新密码'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
