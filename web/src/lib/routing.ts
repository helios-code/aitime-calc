export type Route = 'home' | 'methodology' | 'leaderboard' | 'timeline'

const ROUTE_PATHS: Record<string, Route> = {
  '/methodology': 'methodology',
  '/leaderboard': 'leaderboard',
  '/timeline': 'timeline',
}

export function getRoute(pathname: string): Route {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return ROUTE_PATHS[normalized] ?? 'home'
}
