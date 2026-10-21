import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './app'
import { AuthProvider } from './context/auth'
import './styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

async function boot() {
  if (import.meta.env.VITE_SORTIE_BROWSER_DEMO === 'true') {
    const { installSortieDemo } = await import('./testing/sortie-browser-demo')
    await installSortieDemo()
  }
  createRoot(rootElement!).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  )
}
void boot().catch(() => {
  rootElement.textContent = '演示加载失败，请刷新页面重试。'
})
