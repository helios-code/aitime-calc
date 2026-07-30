import type { CalcResult } from '../types'

interface Props {
  result: CalcResult
}

export function MethodologyExplainer({ result }: Props) {
  return (
    <details className="methodology">
      <summary>How is this calculated? (ATEM methodology)</summary>
      <div className="methodology-body">
        <p>{result.methodology_note}</p>
        <dl className="methodology-params">
          <div>
            <dt>Classic tech-generation length</dt>
            <dd>{result.params.d_classic_months} months</dd>
          </div>
          <div>
            <dt>AI capability doubling time</dt>
            <dd>{result.params.d_ai_months} months</dd>
          </div>
          <div>
            <dt>Multiplier</dt>
            <dd>{result.params.multiplier}×</dd>
          </div>
        </dl>
        <p className="methodology-sources">
          Sources: {result.sources.join(' · ')}
        </p>
      </div>
    </details>
  )
}
