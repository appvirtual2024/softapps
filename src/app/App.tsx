import { BrowserRouter } from 'react-router-dom'
import { SessionProvider } from './providers/SessionProvider'
import { AppRouter } from './routes/AppRouter'

export function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AppRouter />
      </SessionProvider>
    </BrowserRouter>
  )
}
