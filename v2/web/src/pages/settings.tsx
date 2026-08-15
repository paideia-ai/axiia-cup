import { useState } from 'react'
import { Link } from 'react-router-dom'

import { auth } from '../api/client'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useAuth } from '../context/auth'
import { accountRejectCopy } from '../lib/reject-copy'
import { messageOf } from '../lib/use-async'

export function SettingsPage() {
  const { account, elevated, elevate, updateProfile } = useAuth()

  // ── 个人资料：昵称就地编辑 ────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [nameBusy, setNameBusy] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSaved, setNameSaved] = useState(false)

  // ── 修改密码 ────────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordDone, setPasswordDone] = useState(false)

  // ── 管理员提权 ──────────────────────────────────────────────────────────
  const [code, setCode] = useState('')
  const [elevateError, setElevateError] = useState<string | null>(null)
  const [elevateBusy, setElevateBusy] = useState(false)

  if (!account) return null

  const trimmedDraft = nameDraft.trim()

  const startEditName = () => {
    setNameDraft(account.displayName)
    setNameError(null)
    setNameSaved(false)
    setEditingName(true)
  }

  const cancelEditName = () => {
    setEditingName(false)
    setNameError(null)
  }

  const submitName = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!trimmedDraft || trimmedDraft === account.displayName) return
    setNameError(null)
    setNameBusy(true)
    try {
      await updateProfile({ displayName: trimmedDraft })
      setEditingName(false)
      setNameSaved(true)
    } catch (cause) {
      setNameError(accountRejectCopy(cause, '保存失败'))
    } finally {
      setNameBusy(false)
    }
  }

  const submitPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordDone(false)
    // 客户端先挡两类必错提交；其余（当前密码错、节流）留给服务端裁决。
    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的新密码不一致')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('新密码至少 8 位')
      return
    }
    setPasswordError(null)
    setPasswordBusy(true)
    try {
      await auth.changePassword({ current: currentPassword, new: newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordDone(true)
    } catch (cause) {
      setPasswordError(accountRejectCopy(cause, '修改失败'))
    } finally {
      setPasswordBusy(false)
    }
  }

  const submitElevate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setElevateError(null)
    setElevateBusy(true)
    try {
      await elevate(code)
      setCode('')
    } catch (cause) {
      setElevateError(messageOf(cause, '提权失败'))
    } finally {
      setElevateBusy(false)
    }
  }

  return (
    <div className='max-w-xl space-y-6'>
      <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
        账户
      </h1>

      <Card>
        <CardContent className='space-y-3 pt-5 text-sm'>
          <h2 className='text-sm font-semibold text-(--foreground)'>
            个人资料
          </h2>
          <div className='flex items-center justify-between gap-3'>
            <span className='shrink-0 text-(--foreground-muted)'>昵称</span>
            {editingName
              ? (
                <form
                  className='flex flex-1 items-center justify-end gap-2'
                  onSubmit={submitName}
                >
                  <Input
                    aria-label='昵称'
                    className='h-8 max-w-48'
                    maxLength={50}
                    onChange={(e) => setNameDraft(e.target.value)}
                    value={nameDraft}
                  />
                  <Button
                    disabled={nameBusy ||
                      !trimmedDraft ||
                      trimmedDraft === account.displayName}
                    size='sm'
                    type='submit'
                  >
                    {nameBusy ? '保存中…' : '保存'}
                  </Button>
                  <Button
                    onClick={cancelEditName}
                    size='sm'
                    type='button'
                    variant='ghost'
                  >
                    取消
                  </Button>
                </form>
              )
              : (
                <span className='flex items-center gap-2'>
                  <span className='text-(--foreground)'>
                    {account.displayName}
                  </span>
                  {nameSaved
                    ? <span className='text-xs text-(--success)'>已保存</span>
                    : null}
                  <Button
                    onClick={startEditName}
                    size='sm'
                    type='button'
                    variant='ghost'
                  >
                    编辑
                  </Button>
                </span>
              )}
          </div>
          {nameError
            ? <p className='text-right text-sm text-(--accent)'>{nameError}</p>
            : null}
          <div className='flex justify-between'>
            <span className='text-(--foreground-muted)'>邮箱</span>
            <span className='text-(--foreground)'>{account.email ?? '—'}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-(--foreground-muted)'>角色</span>
            <span>
              {account.isAdmin
                ? <Badge tone='warning'>管理员</Badge>
                : <Badge tone='info'>选手</Badge>}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className='space-y-3 pt-5'>
          <h2 className='text-sm font-semibold text-(--foreground)'>
            修改密码
          </h2>
          <form className='space-y-4' onSubmit={submitPassword}>
            <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
              <span>当前密码</span>
              <Input
                autoComplete='current-password'
                name='current-password'
                onChange={(e) => setCurrentPassword(e.target.value)}
                type='password'
                value={currentPassword}
              />
            </label>
            <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
              <span>新密码</span>
              <Input
                autoComplete='new-password'
                name='new-password'
                onChange={(e) => setNewPassword(e.target.value)}
                type='password'
                value={newPassword}
              />
            </label>
            <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
              <span>确认新密码</span>
              <Input
                autoComplete='new-password'
                name='confirm-password'
                onChange={(e) => setConfirmPassword(e.target.value)}
                type='password'
                value={confirmPassword}
              />
            </label>
            {passwordError
              ? <p className='text-sm text-(--accent)'>{passwordError}</p>
              : null}
            {passwordDone
              ? (
                <p className='text-sm text-(--success)'>
                  密码已修改，其他设备已退出登录
                </p>
              )
              : null}
            <Button
              disabled={passwordBusy ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword}
              type='submit'
            >
              {passwordBusy ? '提交中…' : '修改密码'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {account.isAdmin
        ? (
          <Card>
            <CardContent className='space-y-3 pt-5'>
              <div className='flex items-center justify-between'>
                <h2 className='text-sm font-semibold text-(--foreground)'>
                  管理员提权
                </h2>
                {elevated
                  ? <Badge tone='success'>已提权</Badge>
                  : <Badge tone='accent'>未提权</Badge>}
              </div>
              {elevated
                ? (
                  <p className='text-sm text-(--foreground-subtle)'>
                    当前会话已提权。<Link
                      to='/admin'
                      className='text-(--accent)'
                    >
                      进入管理面板
                    </Link>
                  </p>
                )
                : (
                  <form
                    className='flex items-end gap-3'
                    onSubmit={submitElevate}
                  >
                    <label className='flex-1 space-y-1.5 text-sm text-(--foreground-subtle)'>
                      <span>TOTP 验证码 / 恢复码</span>
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder='123456'
                        inputMode='numeric'
                      />
                    </label>
                    <Button
                      type='submit'
                      disabled={elevateBusy || !code.trim()}
                    >
                      {elevateBusy ? '验证中…' : '提权'}
                    </Button>
                  </form>
                )}
              {elevateError
                ? <p className='text-sm text-(--accent)'>{elevateError}</p>
                : null}
            </CardContent>
          </Card>
        )
        : null}
    </div>
  )
}
