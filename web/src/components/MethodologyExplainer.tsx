import { t } from '../lib/i18n'
import type { CalcResult } from '../types'

interface Props {
  result: CalcResult
}

export function MethodologyExplainer({ result }: Props) {
  return (
    <details className="methodology">
      <summary>{t.explainer.summary}</summary>
      <div className="methodology-body">
        <p>{result.methodology_note}</p>
        <dl className="methodology-params">
          <div>
            <dt>{t.explainer.classicLen}</dt>
            <dd>
              {result.params.d_classic_months} {t.explainer.months}
            </dd>
          </div>
          <div>
            <dt>{t.explainer.aiDoubling}</dt>
            <dd>
              {result.params.d_ai_months} {t.explainer.months}
            </dd>
          </div>
          <div>
            <dt>{t.explainer.multiplier}</dt>
            <dd>{result.params.multiplier}×</dd>
          </div>
        </dl>
        <p className="methodology-sources">
          {t.explainer.sourcesLabel}: {result.sources.join(' · ')}
        </p>
        <a className="methodology-full-link" href="/methodology">
          {t.explainer.fullLink}
        </a>
      </div>
    </details>
  )
}
