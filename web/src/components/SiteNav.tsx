import './SiteNav.css'
import { getRoute, type Route } from '../lib/routing'
import { t } from '../lib/i18n'
import { LanguageToggle } from './LanguageToggle'

const LINKS: { href: string; label: string; route: Route }[] = [
  { href: '/', label: t.nav.calculator, route: 'home' },
  { href: '/compare', label: t.nav.compare, route: 'compare' },
  { href: '/timeline', label: t.nav.timeline, route: 'timeline' },
  { href: '/leaderboard', label: t.nav.leaderboard, route: 'leaderboard' },
  { href: '/methodology', label: t.nav.methodology, route: 'methodology' },
]

// One nav for every shipped surface except /embed (that's an iframe widget and
// must stay chrome-free). Active state comes from the same getRoute() the router
// uses, so the highlight can never drift from what actually rendered.
export function SiteNav() {
  const current = getRoute(window.location.pathname)
  return (
    <nav className="site-nav" aria-label={t.nav.primaryAria}>
      <div className="site-nav-inner">
        <a className="site-nav-brand" href="/">
          aitime-calc
        </a>
        <ul className="site-nav-links">
          {LINKS.map((link) => {
            const active = link.route === current
            return (
              <li key={link.href}>
                <a
                  className={active ? 'site-nav-link site-nav-link--active' : 'site-nav-link'}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                </a>
              </li>
            )
          })}
        </ul>
        <LanguageToggle />
      </div>
    </nav>
  )
}
