import { useEffect } from 'react'

export function MethodologyPage() {
  useEffect(() => {
    document.title = 'Methodology — aitime-calc'
  }, [])

  return (
    <div className="app methodology-page">
      <header className="app-header">
        <a className="methodology-back" href="/">
          ← Back to calculator
        </a>
        <span className="brand">aitime-calc</span>
        <h1 className="methodology-title">ATEM Methodology</h1>
        <p className="tagline">
          What the AI-Time Equivalence Model computes, and exactly how.
        </p>
      </header>

      <main className="app-main methodology-page-body">
        <p className="methodology-source-note">
          Source of truth: <code>api/src/atem.ts</code> (<code>computeAtem</code>) and{' '}
          <code>api/src/dataset.ts</code>. If this page ever drifts from the code, the
          code wins.
        </p>

        <section>
          <h2>What ATEM measures</h2>
          <p>
            ATEM converts elapsed time since an AI tool's release into a{' '}
            <strong>human-equivalent time</strong> figure: "how many years of pre-AI,
            classic-software-cadence progress does this much AI progress represent?"
          </p>
          <p>
            It does this by counting how many AI-capability doublings have happened
            since release, then re-expressing that count in classic-tech-generation
            years. It is a deliberately simple heuristic, not a rigorous capability
            benchmark — see Limitations below.
          </p>
        </section>

        <section>
          <h2>Two numbers: base vs. accelerating</h2>
          <p>The calculator can compute the same release/as-of pair two ways:</p>
          <ul>
            <li>
              <strong>Base model</strong> (<code>model: "base"</code>) — assumes AI
              capability doubles at a constant rate the whole time.
            </li>
            <li>
              <strong>Accelerating model</strong> (<code>model: "accelerating"</code>) —
              assumes the doubling time itself is shrinking (AI progress is speeding
              up), so recent months count for more doublings than older ones.
            </li>
          </ul>
          <p>
            Both models report a different <code>aiDoublings</code> count for the same
            period; the calculator shows both so you can see how much the
            "is it accelerating?" assumption moves the answer.
          </p>
        </section>

        <section>
          <h2>The D_classic / D_ai terms</h2>
          <p>
            Two constants drive the base model (<code>AtemParams</code>, defaults in{' '}
            <code>DEFAULT_PARAMS</code>):
          </p>
          <dl className="methodology-params">
            <div>
              <dt>dClassicMonths (default 72)</dt>
              <dd>How long one "classic" tech generation took to double in capability, pre-AI (6 years).</dd>
            </div>
            <div>
              <dt>dAiMonths (default 4.5)</dt>
              <dd>How long one AI-capability doubling takes, base-model assumption.</dd>
            </div>
          </dl>
          <p>
            <code>multiplier = dClassicMonths / dAiMonths</code> — with the defaults,{' '}
            <strong>16×</strong>: every AI doubling is treated as worth 16× a classic
            doubling, because AI doubles ~16 times faster.
          </p>

          <p>
            <strong>Base model</strong>, for elapsed <code>months</code> since release:
          </p>
          <pre className="methodology-formula">
            <code>{`aiDoublings      = months / dAiMonths
humanEquivYears  = (months * multiplier) / 12
                 = aiDoublings * dClassicMonths / 12`}</code>
          </pre>
          <p>
            i.e. count how many AI doublings happened, then say each one "is worth"{' '}
            <code>dClassicMonths</code> of classic progress.
          </p>

          <p>
            <strong>Accelerating model</strong> replaces the constant-rate division
            with a numeric integration: it walks from <code>release</code> to{' '}
            <code>asOf</code> in 400 steps and sums <code>Δmonths / D_ai(t)</code> at
            each step (trapezoidal rule), where <code>D_ai(t)</code> linearly
            interpolates from <strong>7 months</strong> (anchored at 2019-01-01) down
            to <strong>4 months</strong> (anchored at <code>asOf</code>, i.e. "now" for
            that calculation). The result is still turned into years the same way:
          </p>
          <pre className="methodology-formula">
            <code>humanEquivYears = aiDoublings * dClassicMonths / 12</code>
          </pre>
          <p>
            Only how <code>aiDoublings</code> is counted differs between the two
            models — the doublings-to-years conversion is identical.
          </p>
        </section>

        <section>
          <h2>Worked example</h2>
          <p>
            Tool: <strong>GPT-4</strong> (<code>gpt-4</code> in{' '}
            <code>api/src/dataset.ts</code>), released <strong>2023-03-14</strong>.
            Evaluated as of <strong>2025-01-01</strong>, base model, default params
            (<code>dClassicMonths=72</code>, <code>dAiMonths=4.5</code>).
          </p>
          <div className="methodology-table-wrap">
            <table className="methodology-table">
              <thead>
                <tr>
                  <th>step</th>
                  <th>value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>elapsed days</td>
                  <td>659</td>
                </tr>
                <tr>
                  <td>elapsed months (659 / 30.4368)</td>
                  <td>≈ 21.65</td>
                </tr>
                <tr>
                  <td>multiplier (72 / 4.5)</td>
                  <td>16×</td>
                </tr>
                <tr>
                  <td>aiDoublings (21.65 / 4.5)</td>
                  <td>≈ 4.81</td>
                </tr>
                <tr>
                  <td>humanEquivYears (21.65 × 16 / 12)</td>
                  <td>≈ 28.9 years</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            So: in the ~1 yr 10 mo since GPT-4 shipped (as of that date), ATEM's base
            model says AI capability advanced roughly as far as ~28.9 years of
            classic-cadence software progress would have — about 4.8 AI-capability
            doublings, each counted as worth 6 years of classic progress.
          </p>
          <p>
            The same release/as-of pair under the accelerating model would report a{' '}
            <em>different</em> <code>aiDoublings</code> for the earlier portion of that
            span, because <code>D_ai(t)</code> back in 2023 is interpolated closer to 7
            months (slower) than the 4-month rate near <code>asOf</code>; recent
            months dominate. Run it against <code>/api/calc</code> to see the exact
            number for any date.
          </p>
        </section>

        <section>
          <h2>Assumptions and limitations</h2>
          <p>
            Read this before treating any ATEM number as a real forecast — it's a
            back-of-envelope heuristic, not a benchmark:
          </p>
          <ul className="methodology-limitations">
            <li>
              <strong>The 4.5-month and 72-month constants are assumptions, not
              measurements.</strong> They're editable via <code>d_ai_months</code> /{' '}
              <code>d_classic_months</code> on <code>/api/calc</code>; changing them
              changes every downstream number linearly.
            </li>
            <li>
              <strong>"AI-capability doubling" is not a defined, measured
              quantity.</strong> ATEM doesn't measure any actual benchmark score
              doubling — it treats a fixed cadence (or the accelerating interpolation)
              as a stand-in for capability growth. Treat the output as an illustrative
              multiplier, not a citation.
            </li>
            <li>
              <strong>The accelerating model's D_ai interpolation ignores the{' '}
              <code>dAiMonths</code> parameter entirely.</strong>{' '}
              <code>acceleratingDoublings()</code> uses hardcoded anchors (7 months at
              2019-01-01 → 4 months at <code>asOf</code>) and never reads{' '}
              <code>params.dAiMonths</code>. Setting <code>d_ai_months</code> on an
              accelerating-model request changes nothing about the result — it only
              affects the base model. This is a real inconsistency in the current
              code, not a documentation choice.
            </li>
            <li>
              <strong>The accelerating interpolation is relative to <code>asOf</code>,
              not to the actual current date.</strong> The "4 months" anchor always
              lands exactly at whatever <code>asOf</code> you pass, even if{' '}
              <code>asOf</code> is in the past — so accelerating-model results for a
              historical <code>as_of</code> are not what you'd have gotten by running
              the calculator on that date in the past.
            </li>
            <li>
              <strong><code>dClassicMonths</code> (72 months / 6 years) is a single
              flat number</strong> standing in for the whole pre-AI software
              industry's pace, which obviously varied by decade, sector, and company.
            </li>
            <li>
              Dates are UTC midnight and use an average month length (
              <code>30.4368</code> days); day-level precision near month boundaries
              can be off by up to ~1 day of "human" rounding in{' '}
              <code>monthsToHuman</code>.
            </li>
          </ul>
          <p className="methodology-bottom-line">
            Bottom line: ATEM is a <strong>narrative device</strong> for making AI
            progress speed tangible, built on named, inspectable assumptions — not a
            scientific measurement of AI capability.
          </p>
        </section>
      </main>

      <footer className="app-footer">
        <a className="methodology-back" href="/">
          ← Back to calculator
        </a>
      </footer>
    </div>
  )
}
