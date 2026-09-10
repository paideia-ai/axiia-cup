import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './app'
import { AuthProvider } from './context/auth'
import { SoundProvider } from './context/sound'
import './styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <SoundProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </SoundProvider>
  </StrictMode>,
)
