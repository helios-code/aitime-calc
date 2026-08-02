import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MethodologyPage } from './pages/MethodologyPage.tsx'
import { getRoute } from './lib/routing.ts'

const route = getRoute(window.location.pathname)

createRoot(document.getElementById('root')!).render(
  <StrictMode>{route === 'methodology' ? <MethodologyPage /> : <App />}</StrictMode>,
)
