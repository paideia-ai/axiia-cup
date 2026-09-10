import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { SoundProvider } from '../context/sound'
import '../styles.css'
import './sound-demo.css'
import { SoundDemo } from './sound-demo'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SoundProvider>
      <SoundDemo />
    </SoundProvider>
  </StrictMode>,
)
