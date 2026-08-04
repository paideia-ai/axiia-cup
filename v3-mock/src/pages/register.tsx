// C 注册（B2）：邀请码 + 自动登录 → 落进快速通道（A3）。
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button, Card } from '../components/ui'
import { store } from '../mock/store'

export function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invite, setInvite] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    if (!invite.trim()) {
      setError('alpha 阶段注册需要邀请码')
      return
    }
    store.register(name.trim(), email.trim(), invite.trim())
    navigate('/express')
  }

  return (
    <div className='flex min-h-screen flex-col bg-(--background)'>
      <header className='border-b border-(--border-soft)'>
        <div className='mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6'>
          <Link to='/' className='text-sm font-black tracking-[0.24em] text-(--accent)'>
            AXIIA CUP
          </Link>
        </div>
      </header>
      <main className='flex flex-1 items-center justify-center px-4 py-12'>
        <Card className='w-full max-w-md'>
          <h1 className='panel-title mb-1'>注册参赛</h1>
          <p className='panel-copy mb-6 text-sm'>注册后自动登录，直接进入首战快速通道。</p>
          <form
            className='flex flex-col gap-4'
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <label className='flex flex-col gap-1.5'>
              <span className='text-xs font-semibold text-(--foreground-subtle)'>昵称</span>
              <input
                className='app-input'
                placeholder='你的选手名'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className='text-xs font-semibold text-(--foreground-subtle)'>邮箱</span>
              <input
                className='app-input'
                type='email'
                placeholder='you@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className='text-xs font-semibold text-(--foreground-subtle)'>密码</span>
              <input
                className='app-input'
                type='password'
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className='flex flex-col gap-1.5'>
              <span className='text-xs font-semibold text-(--foreground-subtle)'>邀请码</span>
              <input
                className='app-input'
                placeholder='邀请码'
                value={invite}
                onChange={(e) => {
                  setInvite(e.target.value)
                  if (error) setError(null)
                }}
              />
              <span className='text-[11px] text-(--foreground-muted)'>alpha 为邀请制，注册必须填写邀请码。</span>
            </label>
            {error && <p className='text-sm font-semibold text-red-400'>{error}</p>}
            <Button type='submit' size='lg'>注册并开始首战</Button>
          </form>
          <p className='mt-6 text-center text-sm text-(--foreground-subtle)'>
            已有账号？
            <Link to='/login' className='ml-1 font-semibold text-(--accent) hover:text-(--accent-hover)'>
              登录
            </Link>
          </p>
        </Card>
      </main>
    </div>
  )
}
