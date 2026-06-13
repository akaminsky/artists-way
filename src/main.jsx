import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/app.css'
import App from './App'
import { AuthProvider } from './lib/auth'
import { CohortProvider } from './lib/cohort'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CohortProvider>
        <App />
      </CohortProvider>
    </AuthProvider>
  </StrictMode>,
)
