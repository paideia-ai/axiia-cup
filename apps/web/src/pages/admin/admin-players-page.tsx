import type { AdminUser } from '@axiia/shared'
import { useEffect, useRef, useState } from 'react'

import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import {
  getAdminUsers,
  resetAdminUserPassword,
  toggleAdminUserDisabled,
} from '../../lib/api'
import { formatDateTime } from '../../lib/datetime'

export function AdminPlayersPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(
    null,
  )
  const [resetPasswordDraft, setResetPasswordDraft] = useState('')
  const [togglingUserIds, setTogglingUserIds] = useState<number[]>([])
  const [resettingUserIds, setResettingUserIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const latestLoadIdRef = useRef(0)

  useEffect(() => {
    if (!toast) {
      return
    }

    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function loadAdminUsers(isInitial: boolean) {
    const loadId = ++latestLoadIdRef.current

    if (isInitial) {
      setIsLoading(true)
    }

    try {
      setError(null)
      const response = await getAdminUsers()

      if (loadId !== latestLoadIdRef.current) {
        return
      }

      setAdminUsers(response)
    } catch (loadError) {
      if (loadId !== latestLoadIdRef.current) {
        return
      }

      setError(
        loadError instanceof Error ? loadError.message : '加载用户数据失败',
      )
    } finally {
      if (isInitial && loadId === latestLoadIdRef.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadAdminUsers(true)
  }, [])

  async function handleRefresh() {
    try {
      setIsRefreshing(true)
      await loadAdminUsers(false)
    } finally {
      setIsRefreshing(false)
    }
  }

  function handleOpenResetPassword(userId: number) {
    setResetPasswordUserId(userId)
    setResetPasswordDraft('')
  }

  function handleCancelResetPassword() {
    setResetPasswordUserId(null)
    setResetPasswordDraft('')
  }

  async function handleToggleUserDisabled(user: AdminUser) {
    if (user.isAdmin) {
      return
    }

    try {
      setTogglingUserIds((current) =>
        current.includes(user.id) ? current : [...current, user.id],
      )
      setError(null)

      const updatedUser = await toggleAdminUserDisabled(user.id)

      setAdminUsers((current) =>
        current.map((currentUser) =>
          currentUser.id === updatedUser.id ? updatedUser : currentUser,
        ),
      )
      setToast(
        `${updatedUser.displayName} 已${updatedUser.disabled ? '禁用' : '启用'}`,
      )
    } catch (toggleError) {
      setError(
        toggleError instanceof Error ? toggleError.message : '更新用户状态失败',
      )
    } finally {
      setTogglingUserIds((current) =>
        current.filter((currentUserId) => currentUserId !== user.id),
      )
    }
  }

  async function handleResetPassword(user: AdminUser) {
    if (resetPasswordDraft.length < 6) {
      setError('新密码至少需要 6 位')
      return
    }

    try {
      setResettingUserIds((current) =>
        current.includes(user.id) ? current : [...current, user.id],
      )
      setError(null)

      await resetAdminUserPassword(user.id, { password: resetPasswordDraft })

      handleCancelResetPassword()
      setToast(`${user.displayName} 的密码已重置`)
    } catch (resetError) {
      setError(
        resetError instanceof Error ? resetError.message : '重置密码失败',
      )
    } finally {
      setResettingUserIds((current) =>
        current.filter((currentUserId) => currentUserId !== user.id),
      )
    }
  }

  return (
    <div className="space-y-4">
      {toast ? (
        <div className="fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-xl border border-(--border) bg-(--surface-elevated) px-4 py-3 text-sm text-(--foreground) shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <span className="h-2 w-2 shrink-0 rounded-full bg-(--success)" />
          {toast}
        </div>
      ) : null}

      <div className="flex items-center justify-end">
        <Button
          disabled={isLoading || isRefreshing}
          onClick={() => void handleRefresh()}
          size="sm"
          variant="secondary"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </Button>
      </div>

      {error ? <p className="text-sm text-(--accent)">{error}</p> : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 border-none pb-0 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>选手管理</CardTitle>
            <p className="mt-2 text-sm leading-6 text-(--foreground-subtle)">
              查看用户状态、禁用普通账号，并为指定账号重置密码。
            </p>
          </div>
          <Badge tone="info">
            {isLoading ? '同步中...' : `${adminUsers.length} 位用户`}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            ['users-skeleton-1', 'users-skeleton-2', 'users-skeleton-3'].map(
              (key) => (
                <div
                  key={key}
                  className="h-[132px] animate-pulse rounded-xl bg-white/6"
                />
              ),
            )
          ) : adminUsers.length > 0 ? (
            adminUsers.map((user) => {
              const isEditingResetPassword = resetPasswordUserId === user.id
              const isResettingPassword = resettingUserIds.includes(user.id)
              const isTogglingUser = togglingUserIds.includes(user.id)

              return (
                <div
                  key={user.id}
                  className="rounded-xl border border-(--border-soft) bg-white/2 p-4 space-y-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="panel-title">{user.displayName}</p>
                        {user.isAdmin ? (
                          <Badge tone="warning">管理员</Badge>
                        ) : null}
                        <Badge tone={user.disabled ? 'warning' : 'success'}>
                          {user.disabled ? '已禁用' : '启用中'}
                        </Badge>
                      </div>
                      <p className="panel-copy">{user.email}</p>
                      <p className="text-xs text-(--foreground-subtle)">
                        创建时间 · {formatDateTime(user.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      {!user.isAdmin ? (
                        <Button
                          disabled={isResettingPassword || isTogglingUser}
                          onClick={() => void handleToggleUserDisabled(user)}
                          size="sm"
                          variant="secondary"
                        >
                          {isTogglingUser
                            ? '处理中...'
                            : user.disabled
                              ? '启用'
                              : '禁用'}
                        </Button>
                      ) : (
                        <span className="text-xs text-(--foreground-subtle)">
                          管理员账号不可禁用
                        </span>
                      )}

                      {!isEditingResetPassword ? (
                        <Button
                          disabled={isResettingPassword || isTogglingUser}
                          onClick={() => handleOpenResetPassword(user.id)}
                          size="sm"
                          variant="ghost"
                        >
                          重置密码
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {isEditingResetPassword ? (
                    <form
                      className="flex flex-col gap-3 md:flex-row md:items-center"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void handleResetPassword(user)
                      }}
                    >
                      <Input
                        className="md:max-w-sm"
                        onChange={(event) =>
                          setResetPasswordDraft(event.target.value)
                        }
                        placeholder="输入不少于 6 位的新密码"
                        type="password"
                        value={resetPasswordDraft}
                      />
                      <Button
                        disabled={
                          isResettingPassword || resetPasswordDraft.length < 6
                        }
                        size="sm"
                        type="submit"
                      >
                        {isResettingPassword ? '确认中...' : '确认'}
                      </Button>
                      <Button
                        disabled={isResettingPassword}
                        onClick={handleCancelResetPassword}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        取消
                      </Button>
                    </form>
                  ) : null}
                </div>
              )
            })
          ) : (
            <p className="rounded-xl border border-(--border-soft) bg-white/3 px-4 py-5 text-sm text-(--foreground-subtle)">
              暂无用户数据。
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
