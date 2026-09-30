import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ensureCsrfSession } from './lib/security'

// Bootstrap HttpOnly session + CSRF before any /api/mia call.
void ensureCsrfSession().catch(() => {
  /* offline / first paint — gemini.ts retries on demand */
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
