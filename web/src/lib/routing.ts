export type Route = 'home' | 'methodology' | 'leaderboard'

const ROUTE_PATHS: Record<string, Route> = {
  '/methodology': 'methodology',
  '/leaderboard': 'leaderboard',
}

export function getRoute(pathname: string): Route {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return ROUTE_PATHS[normalized] ?? 'home'
}
