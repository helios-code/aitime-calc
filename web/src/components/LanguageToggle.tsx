import { LOCALE, setLocale, t } from '../lib/i18n'

// EN/FR switch. Rendered in the nav (every chrome surface except /embed). Uses
// full-navigation setLocale so the whole page re-resolves its locale — no
// half-translated state.
export function LanguageToggle() {
  return (
    <div className="lang-toggle" role="group" aria-label={t.lang.label}>
      <button
        type="button"
        className={LOCALE === 'en' ? 'lang-btn active' : 'lang-btn'}
        aria-pressed={LOCALE === 'en'}
        aria-label={t.lang.switchToEn}
        onClick={() => setLocale('en')}
      >
        {t.lang.en}
      </button>
      <button
        type="button"
        className={LOCALE === 'fr' ? 'lang-btn active' : 'lang-btn'}
        aria-pressed={LOCALE === 'fr'}
        aria-label={t.lang.switchToFr}
        onClick={() => setLocale('fr')}
      >
        {t.lang.fr}
      </button>
    </div>
  )
}
