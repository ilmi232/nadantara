import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// font disimpan di aplikasi (bukan Google Fonts) supaya tetap tampil saat offline
import '@fontsource/plus-jakarta-sans/latin-400.css'
import '@fontsource/plus-jakarta-sans/latin-600.css'
import '@fontsource/plus-jakarta-sans/latin-700.css'
import '@fontsource/fraunces/latin-600.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
