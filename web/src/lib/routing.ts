export type Route = 'home' | 'methodology'

export function getRoute(pathname: string): Route {
  return pathname.replace(/\/+$/, '') === '/methodology' ? 'methodology' : 'home'
}
