import { StrictMode, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MethodologyPage } from './pages/MethodologyPage.tsx'
import Leaderboard from './pages/Leaderboard.tsx'
import { getRoute, type Route } from './lib/routing.ts'

const ROUTE_COMPONENTS: Record<Route, ComponentType> = {
  home: App,
  methodology: MethodologyPage,
  leaderboard: Leaderboard,
}

const route = getRoute(window.location.pathname)
const RouteComponent = ROUTE_COMPONENTS[route]

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouteComponent />
  </StrictMode>,
)
