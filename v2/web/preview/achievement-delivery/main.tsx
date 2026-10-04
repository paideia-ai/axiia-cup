import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'

import { Button } from '../../src/components/ui/button'
import { AchievementsProvider } from '../../src/context/achievements'
import { setNavigationIdentity } from '../../src/lib/navigation-cache'
import { installSoundListeners } from '../../src/lib/sound'
import { AchievementCollection } from '../../src/pages/achievements'
import {
  ACCOUNTS,
  collection,
  fixtureAccount,
  grantThree,
  installFixtureAPI,
  resetPreview,
  selectAccount,
  selectedAccount,
} from './fixture'
import './preview.css'

installFixtureAPI()
setNavigationIdentity(`${selectedAccount()}:false`)

function Preview() {
  const [accountID, setAccountID] = useState(selectedAccount)
  const [, refresh] = useState(0)
  const account = fixtureAccount(accountID)
  const unlocked = account.events.length
  useEffect(() => installSoundListeners(), [])
  useEffect(() => {
    const sync = () => {
      const next = selectedAccount()
      setNavigationIdentity(`${next}:false`)
      setAccountID(next)
      refresh((version) => version + 1)
    }
    const timer = setInterval(sync, 1000)
    globalThis.addEventListener('storage', sync)
    globalThis.addEventListener('achievement-delivery-preview:change', sync)
    return () => {
      clearInterval(timer)
      globalThis.removeEventListener('storage', sync)
      globalThis.removeEventListener(
        'achievement-delivery-preview:change',
        sync,
      )
    }
  }, [])

  return (
    <BrowserRouter>
      <AchievementsProvider key={accountID} accountID={accountID}>
        <main className='delivery-preview'>
          <header>
            <Link to='/' className='delivery-brand'>AXIIA CUP</Link>
            <h1>成就提示 · 刷新后继续</h1>
            <p>
              一次解锁多项成就，刷新页面后继续查看尚未展示的提示。
              此预览保存在你的浏览器中，不影响正式账号。
            </p>
          </header>
          <section className='delivery-controls' aria-label='体验设置'>
            <label htmlFor='preview-account'>演示账号</label>
            <select
              id='preview-account'
              value={accountID}
              onChange={(event) => selectAccount(event.target.value)}
            >
              {ACCOUNTS.map((id, index) => (
                <option key={id} value={id}>
                  账号 {index === 0 ? 'A' : 'B'}
                </option>
              ))}
            </select>
            <div className='delivery-buttons'>
              <Button
                disabled={unlocked === 4 || account.scheduledAt != null}
                onClick={() => grantThree(accountID)}
              >
                解锁 3 项成就
              </Button>
              <Button
                variant='secondary'
                disabled={unlocked === 4 || account.scheduledAt != null}
                onClick={() => grantThree(accountID, 5000)}
              >
                5 秒后解锁 3 项
              </Button>
              <Button variant='secondary' onClick={resetPreview}>
                重置预览
              </Button>
            </div>
            <p role='status'>
              {account.scheduledAt != null
                ? '已安排解锁。可以切换到其他标签页，稍后回来查看。'
                : `此账号已获得 ${unlocked} / 4 项成就。`}
            </p>
          </section>
          <nav aria-label='预览导航'>
            <Link to='/settings/achievements'>打开成就中心</Link>
            <a href={location.href} target='_blank' rel='noopener noreferrer'>
              打开另一个标签页
            </a>
          </nav>
          <Routes>
            <Route
              path='/settings/achievements'
              element={
                <section className='delivery-collection' aria-label='成就中心'>
                  <h2>成就中心</h2>
                  <AchievementCollection achievements={collection(accountID)} />
                </section>
              }
            />
            <Route
              path='*'
              element={
                <ol className='delivery-guide'>
                  <li>点击「解锁 3 项成就」，右下角依次出现提示。</li>
                  <li>第一项出现后刷新页面，继续展示余下两项。</li>
                  <li>也可以安排延迟解锁，再切到另一个标签页体验。</li>
                  <li>已有成就保持安静；点击提示可在新标签页查看详情。</li>
                </ol>
              }
            />
          </Routes>
        </main>
      </AchievementsProvider>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(<Preview />)
