import { useEffect } from 'react'
import { SiteNav } from '../components/SiteNav'
import { SiteFooter } from '../components/SiteFooter'
import { LOCALE, t } from '../lib/i18n'
import { METHODOLOGY } from '../content/methodology'

export function MethodologyPage() {
  useEffect(() => {
    document.title = t.methodologyPage.docTitle
  }, [])

  return (
    <>
      <SiteNav />
      <div className="app methodology-page">
        <header className="app-header">
          <h1 className="methodology-title">{t.methodologyPage.title}</h1>
          <p className="tagline">{t.methodologyPage.tagline}</p>
        </header>

        <main className="app-main methodology-page-body">
          {METHODOLOGY[LOCALE]}
        </main>
        <SiteFooter />
      </div>
    </>
  )
}
