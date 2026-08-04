import { StrictMode, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './index.css'
import App from './App.tsx'
import { MethodologyPage } from './pages/MethodologyPage.tsx'
import Leaderboard from './pages/Leaderboard.tsx'
import { TimelinePage } from './pages/TimelinePage.tsx'
import Compare from './pages/Compare.tsx'
import Embed from './pages/Embed.tsx'
import { getRoute, type Route } from './lib/routing.ts'

const ROUTE_COMPONENTS: Record<Route, ComponentType> = {
  home: App,
  methodology: MethodologyPage,
  leaderboard: Leaderboard,
  timeline: TimelinePage,
  compare: Compare,
  embed: Embed,
}

const route = getRoute(window.location.pathname)
const RouteComponent = ROUTE_COMPONENTS[route]

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouteComponent />
  </StrictMode>,
)
