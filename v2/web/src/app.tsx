import { AppRouter } from './app-router'
import { SoundProvider } from './context/sound'

export default function App() {
  return (
    <SoundProvider>
      <AppRouter />
    </SoundProvider>
  )
}
