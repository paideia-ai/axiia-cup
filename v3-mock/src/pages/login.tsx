// B 登录（B2）：邮箱登录；手机号近上线再加。mock：任意输入均可登录。
import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button, Card } from '../components/ui'
import { store } from '../mock/store'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const doLogin = () => {
    store.loginDemo()
    navigate('/scenarios')
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
          <h1 className='panel-title mb-1'>登录</h1>
          <p className='panel-copy mb-6 text-sm'>邮箱登录（手机号登录近上线再加）。</p>
          <form
            className='flex flex-col gap-4'
            onSubmit={(e) => {
              e.preventDefault()
              doLogin()
            }}
          >
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
            <Button type='submit' size='lg'>登录</Button>
          </form>
          <div className='my-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-(--foreground-muted)'>
            <span className='h-px flex-1 bg-(--border-soft)' />
            或
            <span className='h-px flex-1 bg-(--border-soft)' />
          </div>
          <Button size='lg' variant='secondary' className='w-full' onClick={doLogin}>
            <Sparkles className='h-4 w-4' />
            使用演示账号登录
          </Button>
          <p className='mt-6 text-center text-sm text-(--foreground-subtle)'>
            还没有账号？
            <Link to='/register' className='ml-1 font-semibold text-(--accent) hover:text-(--accent-hover)'>
              注册参赛
            </Link>
          </p>
        </Card>
      </main>
    </div>
  )
}
