import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import {
  Link,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import {
  NavigationMemoryProvider,
  useScrollPending,
} from '../context/navigation-memory'
import { BackLink } from '../components/back-link'
import { NAVIGATION_STORAGE_KEY } from './navigation-memory'

function Inventory() {
  const [loaded, setLoaded] = useState(false)
  useScrollPending(!loaded)
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 150)
    return () => clearTimeout(timer)
  }, [])
  return (
    <div style={{ height: loaded ? 3500 : 200 }}>
      <h1>长清单</h1>
    </div>
  )
}
function Pages() {
  const { pathname } = useLocation()
  return (
    <>
      <nav className='fixed top-2 left-2 z-50 bg-(--background) p-3'>
        {pathname === '/my-agents'
          ? <Link to='/agents/1'>进入智能体</Link>
          : <BackLink to='/my-agents' label='我的智能体' />}
      </nav>
      <Routes>
        <Route path='/my-agents' element={<Inventory />} />
        <Route
          path='/agents/1'
          element={<div style={{ height: 200 }}>智能体主页</div>}
        />
      </Routes>
    </>
  )
}
const meta = {
  title: 'Agents/Scroll memory',
  beforeEach: () => {
    sessionStorage.removeItem(NAVIGATION_STORAGE_KEY)
  },
  render: () => (
    <MemoryRouter
      initialEntries={[{
        pathname: '/my-agents',
        key: 'inventory-scroll-story',
      }]}
    >
      <NavigationMemoryProvider scope='inventory-scroll-story'>
        <Pages />
      </NavigationMemoryProvider>
    </MemoryRouter>
  ),
} satisfies Meta
export default meta

export const ExplicitReturnAfterAsyncLoad: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(document.documentElement.scrollHeight).toBeGreaterThan(3000)
    )
    globalThis.scrollTo({ top: 1500, behavior: 'instant' })
    await waitFor(() => expect(globalThis.scrollY).toBe(1500))
    // Let the browser deliver the scroll event before navigating.
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    )
    await userEvent.click(canvas.getByRole('link', { name: '进入智能体' }))
    await userEvent.click(canvas.getByRole('link', { name: /我的智能体/ }))
    await waitFor(() => expect(globalThis.scrollY).toBe(1500))
  },
}
