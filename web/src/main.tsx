import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Leaderboard from './pages/Leaderboard.tsx'

const Page = window.location.pathname.replace(/\/+$/, '') === '/leaderboard' ? Leaderboard : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
