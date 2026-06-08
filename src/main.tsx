import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { init } from '@neutralinojs/lib'
import './index.css'
import App from './App.tsx'

if (typeof window.NL_PORT === 'number' && typeof window.NL_TOKEN === 'string') {
  init()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
