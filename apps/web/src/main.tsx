import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './app'
import { AuthProvider } from './context/auth'
import { ImpersonationProvider } from './context/impersonation'
import './styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <ImpersonationProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ImpersonationProvider>
  </StrictMode>,
)
