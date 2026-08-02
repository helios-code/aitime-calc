export type Route = 'home' | 'methodology' | 'leaderboard' | 'compare'

const ROUTE_PATHS: Record<string, Route> = {
  '/methodology': 'methodology',
  '/leaderboard': 'leaderboard',
  '/compare': 'compare',
}

export function getRoute(pathname: string): Route {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return ROUTE_PATHS[normalized] ?? 'home'
}
