// Dependency-light i18n. A hand-rolled typed strings map + t() beats pulling in
// i18next for ~6 pages: no runtime, no bundle weight, and TypeScript enforces
// that `fr` implements exactly the same keys as `en` (a missing translation is a
// compile error, not a silent English fallback).
//
// Locale is resolved ONCE at module load into `LOCALE`. The language toggle
// persists the choice and does a full navigation, so every module re-resolves on
// the next load — there is never a half-translated screen from stale module
// state. See .niwa-decision.md for the push-reload rationale and the ?lang /
// urlState interaction.

export type Locale = 'en' | 'fr'
export const LOCALES: readonly Locale[] = ['en', 'fr']

export function isLocale(v: string | null | undefined): v is Locale {
  return v === 'en' || v === 'fr'
}

// Precedence: explicit ?lang param > stored choice > browser language > English.
// Pure and side-effect free so the resolution order is unit-testable.
export function resolveLocale(input: {
  param?: string | null
  stored?: string | null
  navigator?: string | null
}): Locale {
  if (isLocale(input.param)) return input.param
  if (isLocale(input.stored)) return input.stored
  if ((input.navigator ?? '').toLowerCase().startsWith('fr')) return 'fr'
  return 'en'
}

export const STORAGE_KEY = 'aitime-lang'
export const LANG_PARAM = 'lang'

function resolveEnvLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const param = new URLSearchParams(window.location.search).get(LANG_PARAM)
  let stored: string | null = null
  try {
    stored = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    stored = null
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : null
  return resolveLocale({ param, stored, navigator: nav })
}

// The active locale for this page load.
export const LOCALE: Locale = resolveEnvLocale()

// Keep the document's <html lang> in sync with the active locale so screen
// readers announce the right language. index.html ships lang="en"; under FR that
// would mislead assistive tech. The toggle does a full navigation, so setting
// this once at module load covers every locale switch — but the function is
// exported and reusable should an in-place switch ever be added.
export function syncDocumentLang(locale: Locale): void {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale
}

syncDocumentLang(LOCALE)

// Persist the choice and reload. A full navigation (not in-place state) is the
// deliberate trade: this app renders from module-load constants with no context
// provider, so reloading is the simplest way to guarantee no mixed-language
// screen. `lang` is written to the URL too, keeping links shareable; it is
// orthogonal to the compare/timeline params in urlState, which ignore it.
export function setLocale(locale: Locale): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    /* private mode / storage disabled — the ?lang param still carries the choice */
  }
  const url = new URL(window.location.href)
  url.searchParams.set(LANG_PARAM, locale)
  window.location.assign(url.toString())
}

// ---- Strings ----

const en = {
  nav: {
    calculator: 'Calculator',
    compare: 'Compare',
    timeline: 'Timeline',
    leaderboard: 'Leaderboard',
    methodology: 'Methodology',
    primaryAria: 'Primary',
  },
  lang: {
    label: 'Language',
    en: 'EN',
    fr: 'FR',
    switchToEn: 'Switch to English',
    switchToFr: 'Passer en français',
  },
  footer: {
    versionKnownTitle: 'Running API version (/api/health)',
    versionUnknownTitle: 'API version unavailable',
  },
  home: {
    tagline: 'How much human progress did that AI release compress?',
    toolsLabel: 'Tools',
    calcLabel: 'Calc',
  },
  modeTabs: {
    ariaLabel: 'Input mode',
    pickTool: 'Pick a known tool',
    enterDate: 'Enter a release date',
  },
  datePicker: {
    label: 'Release date',
  },
  modelToggle: {
    ariaLabel: 'Calculation model',
    base: 'Base',
    accelerating: 'Accelerating',
  },
  advanced: {
    summary: 'Advanced assumptions',
    edited: 'edited',
    aiLabel: 'AI doubling time (months)',
    classicLabel: 'Classic tech-generation length (months)',
    reset: 'Reset to defaults',
  },
  result: {
    sinceToolPrefix: 'Since',
    sinceToolSuffix: ' shipped',
    sinceDatePrefix: 'Since',
    elapsedAgo: (human: string) => `— ${human} ago`,
    unit: 'human-equivalent years',
    contrastAria: 'Calendar time vs human-equivalent time',
    calendarTime: 'Calendar time',
    humanEquivalent: 'Human-equivalent',
    doublingsSuffix: 'AI capability doublings compressed into that window',
  },
  share: {
    label: 'Share this result',
    copyResult: 'Copy result',
    copyLink: 'Copy link',
    copyEmbed: 'Copy embed',
    copied: 'Copied ✓',
    failed: "Couldn't copy — select the text above and copy manually.",
    shareText: (subject: string, years: string, elapsed: string, comparison: string) =>
      `${subject} = ~${years} human-equivalent years compressed into ${elapsed}. ${comparison}`,
  },
  explainer: {
    summary: 'How is this calculated? (ATEM methodology)',
    classicLen: 'Classic tech-generation length',
    aiDoubling: 'AI capability doubling time',
    multiplier: 'Multiplier',
    months: 'months',
    sourcesLabel: 'Sources',
    fullLink: 'Full methodology, worked example & limitations →',
  },
  source: {
    liveTitle: 'Served by the aitime-calc API',
    mockTitle: 'API unreachable — showing local ATEM calculation',
    live: 'live API',
    offline: 'offline calc',
  },
  compare: {
    docTitle: 'Compare AI tools — human-equivalent time | aitime-calc',
    title: 'Compare two tools',
    subtitle: 'Side-by-side human-equivalent time.',
    vs: 'vs',
    pickerA: 'Search the first AI tool to compare',
    pickerB: 'Search the second AI tool to compare',
    unit: 'human-equiv years',
    released: 'Released',
    elapsed: 'Elapsed',
    aiDoublings: 'AI doublings',
    calcLabel: 'Calc',
    toolsLabel: 'tools',
    shareLabel: 'Share this comparison',
    copyLink: 'Copy link',
    delta: (amount: string, more: boolean, a: string, b: string) =>
      `${amount} human-equiv years ${more ? 'more' : 'fewer'} for ${a} than ${b}`,
  },
  timeline: {
    title: 'Every tool in the dataset, on one human-equivalent-time axis',
    caption:
      'Y-axis (log scale): human-equivalent years compressed since each tool shipped, as of today. X-axis: release date. Click a point to open that tool’s full result.',
    chartAria:
      'Human-equivalent years compressed since each tool’s release, plotted against release date. Older releases show more compressed human-equivalent time.',
    toolsLabel: 'Tools',
    shareLabel: 'Share this view',
    pointAria: (name: string, date: string, years: string) =>
      `${name}, released ${date}: ${years} human-equivalent years compressed since. Open this result.`,
  },
  leaderboard: {
    pageTitle: 'AI tool leaderboard — human-equivalent years compressed | aitime-calc',
    pageDescription:
      'Every AI tool ranked by how much human-equivalent time it compressed, from GPT-2 to the present.',
    title: 'AI tool leaderboard',
    subtitle: 'Every tool ranked by human-equivalent years compressed.',
    exportLabel: 'Export',
    loading: 'Loading…',
    exportBlocked: 'Download blocked by the browser. Check its download settings and try again.',
    sourceLabel: 'leaderboard',
    colRank: 'Rank',
    colTool: 'Tool',
    colYears: 'Human-equiv years',
    colDate: 'Release date',
    sortLabels: {
      rank: 'rank',
      name: 'tool name',
      human_equiv_years: 'human-equivalent years',
      release_date: 'release date',
    } as Record<string, string>,
    caption: (dir: 'asc' | 'desc', label: string) =>
      `Sorted ${dir === 'asc' ? 'ascending' : 'descending'} by ${label} (base model)`,
  },
  embed: {
    docTitle: 'aitime-calc — embedded result',
    calcLabel: 'Calc',
  },
  methodologyPage: {
    docTitle: 'Methodology — aitime-calc',
    title: 'ATEM Methodology',
    tagline: 'What the AI-Time Equivalence Model computes, and exactly how.',
  },
}

// `fr` must structurally match `en`. Typed as the shape of `en`, so a missing or
// misnamed key fails the build. Dataset notes/names are data (English) and are
// never routed through here.
type Strings = typeof en

const fr: Strings = {
  nav: {
    calculator: 'Calculateur',
    compare: 'Comparer',
    timeline: 'Chronologie',
    leaderboard: 'Classement',
    methodology: 'Méthodologie',
    primaryAria: 'Principale',
  },
  lang: {
    label: 'Langue',
    en: 'EN',
    fr: 'FR',
    switchToEn: 'Switch to English',
    switchToFr: 'Passer en français',
  },
  footer: {
    versionKnownTitle: 'Version de l’API en service (/api/health)',
    versionUnknownTitle: 'Version de l’API indisponible',
  },
  home: {
    tagline: 'Quelle quantité de progrès humain cette sortie IA a-t-elle compressée ?',
    toolsLabel: 'Outils',
    calcLabel: 'Calcul',
  },
  modeTabs: {
    ariaLabel: 'Mode de saisie',
    pickTool: 'Choisir un outil connu',
    enterDate: 'Saisir une date de sortie',
  },
  datePicker: {
    label: 'Date de sortie',
  },
  modelToggle: {
    ariaLabel: 'Modèle de calcul',
    base: 'Base',
    accelerating: 'Accéléré',
  },
  advanced: {
    summary: 'Hypothèses avancées',
    edited: 'modifié',
    aiLabel: 'Temps de doublement IA (mois)',
    classicLabel: 'Durée d’une génération technologique classique (mois)',
    reset: 'Réinitialiser',
  },
  result: {
    sinceToolPrefix: 'Depuis la sortie de',
    sinceToolSuffix: '',
    sinceDatePrefix: 'Depuis le',
    elapsedAgo: (human: string) => `— il y a ${human}`,
    unit: 'années de temps humain équivalent',
    contrastAria: 'Temps calendaire vs temps humain équivalent',
    calendarTime: 'Temps calendaire',
    humanEquivalent: 'Temps humain équivalent',
    doublingsSuffix: 'doublements de capacité IA compressés dans cet intervalle',
  },
  share: {
    label: 'Partager ce résultat',
    copyResult: 'Copier le résultat',
    copyLink: 'Copier le lien',
    copyEmbed: 'Copier l’intégration',
    copied: 'Copié ✓',
    failed: 'Copie impossible — sélectionnez le texte ci-dessus et copiez-le manuellement.',
    shareText: (subject: string, years: string, elapsed: string, comparison: string) =>
      `${subject} = ~${years} années de temps humain équivalent compressées en ${elapsed}. ${comparison}`,
  },
  explainer: {
    summary: 'Comment est-ce calculé ? (méthodologie ATEM)',
    classicLen: 'Durée d’une génération technologique classique',
    aiDoubling: 'Temps de doublement de capacité IA',
    multiplier: 'Multiplicateur',
    months: 'mois',
    sourcesLabel: 'Sources',
    fullLink: 'Méthodologie complète, exemple détaillé et limites →',
  },
  source: {
    liveTitle: 'Fourni par l’API aitime-calc',
    mockTitle: 'API injoignable — calcul ATEM local affiché',
    live: 'API en direct',
    offline: 'calcul hors ligne',
  },
  compare: {
    docTitle: 'Comparer des outils IA — temps humain équivalent | aitime-calc',
    title: 'Comparer deux outils',
    subtitle: 'Temps humain équivalent, côte à côte.',
    vs: 'vs',
    pickerA: 'Rechercher le premier outil IA à comparer',
    pickerB: 'Rechercher le second outil IA à comparer',
    unit: 'années équivalentes',
    released: 'Sortie',
    elapsed: 'Écoulé',
    aiDoublings: 'Doublements IA',
    calcLabel: 'Calcul',
    toolsLabel: 'outils',
    shareLabel: 'Partager cette comparaison',
    copyLink: 'Copier le lien',
    delta: (amount: string, more: boolean, a: string, b: string) =>
      `${amount} années équivalentes ${more ? 'de plus' : 'de moins'} pour ${a} que pour ${b}`,
  },
  timeline: {
    title: 'Tous les outils du jeu de données, sur un même axe de temps humain équivalent',
    caption:
      'Axe Y (échelle log) : années de temps humain équivalent compressées depuis la sortie de chaque outil, à ce jour. Axe X : date de sortie. Cliquez sur un point pour ouvrir le résultat complet de cet outil.',
    chartAria:
      'Années de temps humain équivalent compressées depuis la sortie de chaque outil, en fonction de la date de sortie. Les sorties plus anciennes montrent un temps humain équivalent plus compressé.',
    toolsLabel: 'Outils',
    shareLabel: 'Partager cette vue',
    pointAria: (name: string, date: string, years: string) =>
      `${name}, sorti le ${date} : ${years} années de temps humain équivalent compressées depuis. Ouvrir ce résultat.`,
  },
  leaderboard: {
    pageTitle: 'Classement des outils IA — années de temps humain équivalent compressées | aitime-calc',
    pageDescription:
      'Tous les outils IA classés selon le temps humain équivalent qu’ils ont compressé, de GPT-2 à aujourd’hui.',
    title: 'Classement des outils IA',
    subtitle: 'Tous les outils classés par années de temps humain équivalent compressées.',
    exportLabel: 'Exporter',
    loading: 'Chargement…',
    exportBlocked: 'Téléchargement bloqué par le navigateur. Vérifiez ses réglages de téléchargement et réessayez.',
    sourceLabel: 'classement',
    colRank: 'Rang',
    colTool: 'Outil',
    colYears: 'Années équivalentes',
    colDate: 'Date de sortie',
    sortLabels: {
      rank: 'rang',
      name: 'nom de l’outil',
      human_equiv_years: 'années de temps humain équivalent',
      release_date: 'date de sortie',
    } as Record<string, string>,
    caption: (dir: 'asc' | 'desc', label: string) =>
      `Trié par ordre ${dir === 'asc' ? 'croissant' : 'décroissant'} selon ${label} (modèle base)`,
  },
  embed: {
    docTitle: 'aitime-calc — résultat intégré',
    calcLabel: 'Calcul',
  },
  methodologyPage: {
    docTitle: 'Méthodologie — aitime-calc',
    title: 'Méthodologie ATEM',
    tagline: 'Ce que calcule le modèle d’équivalence temps-IA (ATEM), et exactement comment.',
  },
}

// The active strings for this page load. Components read `t.section.key`
// directly — typed, so a wrong key is a compile error.
export const t: Strings = LOCALE === 'fr' ? fr : en
