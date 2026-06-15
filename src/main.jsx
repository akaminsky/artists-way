import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles/tokens.css'
import './styles/app.css'
import App from './App'
import { AuthProvider } from './lib/auth'
import { CohortProvider } from './lib/cohort'

// Keep the installed PWA fresh. The service worker already skipWaiting+claims, so
// a found update activates immediately; with registerType 'autoUpdate' the page
// then reloads to the new version on its own. The catch on iOS: a home-screen PWA
// only checks for an update on a cold launch, so backgrounding/reopening keeps the
// old version (which is why deleting + re-adding "fixes" it). So we also re-check
// whenever the app regains focus, and hourly while it's open — no reinstall needed.
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, r) {
    if (!r) return
    const check = () => r.update().catch(() => {})
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
    setInterval(check, 60 * 60 * 1000)
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CohortProvider>
        <App />
      </CohortProvider>
    </AuthProvider>
  </StrictMode>,
)
