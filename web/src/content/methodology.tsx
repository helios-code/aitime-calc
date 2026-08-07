import type { ReactNode } from 'react'
import type { Locale } from '../lib/i18n'

// The methodology page is a translated document, not a handful of labels — its
// prose is dense with inline <code>/<strong> and formulas. Atomising it into a
// flat strings map would be unreadable and drift-prone, so each locale's body
// lives here as a whole JSX node and MethodologyPage renders the active one.
// Code identifiers, formulas, and numeric constants are data — identical in both
// locales, never translated.

const en: ReactNode = (
  <>
    <p className="methodology-source-note">
      Source of truth: <code>api/src/atem.ts</code> (<code>computeAtem</code>) and{' '}
      <code>api/src/dataset.ts</code>. If this page ever drifts from the code, the code wins.
    </p>

    <section>
      <h2>What ATEM measures</h2>
      <p>
        ATEM converts elapsed time since an AI tool's release into a{' '}
        <strong>human-equivalent time</strong> figure: "how many years of pre-AI,
        classic-software-cadence progress does this much AI progress represent?"
      </p>
      <p>
        It does this by counting how many AI-capability doublings have happened since release,
        then re-expressing that count in classic-tech-generation years. It is a deliberately
        simple heuristic, not a rigorous capability benchmark — see Limitations below.
      </p>
    </section>

    <section>
      <h2>Two numbers: base vs. accelerating</h2>
      <p>The calculator can compute the same release/as-of pair two ways:</p>
      <ul>
        <li>
          <strong>Base model</strong> (<code>model: "base"</code>) — assumes AI capability
          doubles at a constant rate the whole time.
        </li>
        <li>
          <strong>Accelerating model</strong> (<code>model: "accelerating"</code>) — assumes the
          doubling time itself is shrinking (AI progress is speeding up), so recent months count
          for more doublings than older ones.
        </li>
      </ul>
      <p>
        Both models report a different <code>aiDoublings</code> count for the same period; the
        calculator shows both so you can see how much the "is it accelerating?" assumption moves
        the answer.
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
        <strong>16×</strong>: every AI doubling is treated as worth 16× a classic doubling,
        because AI doubles ~16 times faster.
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
        <strong>Accelerating model</strong> replaces the constant-rate division with a numeric
        integration: it walks from <code>release</code> to <code>asOf</code> in 400 steps and
        sums <code>Δmonths / D_ai(t)</code> at each step (trapezoidal rule), where{' '}
        <code>D_ai(t)</code> linearly interpolates from <strong>7 months</strong> (anchored at
        2019-01-01) down to <strong>4 months</strong> (anchored at <code>asOf</code>, i.e. "now"
        for that calculation). The result is still turned into years the same way:
      </p>
      <pre className="methodology-formula">
        <code>humanEquivYears = aiDoublings * dClassicMonths / 12</code>
      </pre>
      <p>
        Only how <code>aiDoublings</code> is counted differs between the two models — the
        doublings-to-years conversion is identical.
      </p>
    </section>

    <section>
      <h2>Worked example</h2>
      <p>
        Tool: <strong>GPT-4</strong> (<code>gpt-4</code> in <code>api/src/dataset.ts</code>),
        released <strong>2023-03-14</strong>. Evaluated as of <strong>2025-01-01</strong>, base
        model, default params (<code>dClassicMonths=72</code>, <code>dAiMonths=4.5</code>).
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
        So: in the ~1 yr 10 mo since GPT-4 shipped (as of that date), ATEM's base model says AI
        capability advanced roughly as far as ~28.9 years of classic-cadence software progress
        would have — about 4.8 AI-capability doublings, each counted as worth 6 years of classic
        progress.
      </p>
      <p>
        The same release/as-of pair under the accelerating model would report a <em>different</em>{' '}
        <code>aiDoublings</code> for the earlier portion of that span, because <code>D_ai(t)</code>{' '}
        back in 2023 is interpolated closer to 7 months (slower) than the 4-month rate near{' '}
        <code>asOf</code>; recent months dominate. Run it against <code>/api/calc</code> to see the
        exact number for any date.
      </p>
    </section>

    <section>
      <h2>Assumptions and limitations</h2>
      <p>
        Read this before treating any ATEM number as a real forecast — it's a back-of-envelope
        heuristic, not a benchmark:
      </p>
      <ul className="methodology-limitations">
        <li>
          <strong>The 4.5-month and 72-month constants are assumptions, not measurements.</strong>{' '}
          They're editable via <code>d_ai_months</code> / <code>d_classic_months</code> on{' '}
          <code>/api/calc</code>; changing them changes every downstream number linearly.
        </li>
        <li>
          <strong>"AI-capability doubling" is not a defined, measured quantity.</strong> ATEM
          doesn't measure any actual benchmark score doubling — it treats a fixed cadence (or the
          accelerating interpolation) as a stand-in for capability growth. Treat the output as an
          illustrative multiplier, not a citation.
        </li>
        <li>
          <strong>
            The accelerating model's D_ai interpolation ignores the <code>dAiMonths</code>{' '}
            parameter entirely.
          </strong>{' '}
          <code>acceleratingDoublings()</code> uses hardcoded anchors (7 months at 2019-01-01 → 4
          months at <code>asOf</code>) and never reads <code>params.dAiMonths</code>. Setting{' '}
          <code>d_ai_months</code> on an accelerating-model request changes nothing about the
          result — it only affects the base model. This is a real inconsistency in the current
          code, not a documentation choice.
        </li>
        <li>
          <strong>
            The accelerating interpolation is relative to <code>asOf</code>, not to the actual
            current date.
          </strong>{' '}
          The "4 months" anchor always lands exactly at whatever <code>asOf</code> you pass, even
          if <code>asOf</code> is in the past — so accelerating-model results for a historical{' '}
          <code>as_of</code> are not what you'd have gotten by running the calculator on that date
          in the past.
        </li>
        <li>
          <strong>
            <code>dClassicMonths</code> (72 months / 6 years) is a single flat number
          </strong>{' '}
          standing in for the whole pre-AI software industry's pace, which obviously varied by
          decade, sector, and company.
        </li>
        <li>
          Dates are UTC midnight and use an average month length (<code>30.4368</code> days);
          day-level precision near month boundaries can be off by up to ~1 day of "human" rounding
          in <code>monthsToHuman</code>.
        </li>
      </ul>
      <p className="methodology-bottom-line">
        Bottom line: ATEM is a <strong>narrative device</strong> for making AI progress speed
        tangible, built on named, inspectable assumptions — not a scientific measurement of AI
        capability.
      </p>
    </section>
  </>
)

const fr: ReactNode = (
  <>
    <p className="methodology-source-note">
      Source de vérité : <code>api/src/atem.ts</code> (<code>computeAtem</code>) et{' '}
      <code>api/src/dataset.ts</code>. Si cette page s'écarte du code, c'est le code qui fait foi.
    </p>

    <section>
      <h2>Ce que mesure ATEM</h2>
      <p>
        ATEM convertit le temps écoulé depuis la sortie d'un outil IA en une mesure de{' '}
        <strong>temps humain équivalent</strong> : « combien d'années de progrès d'avant l'IA, au
        rythme du logiciel classique, ce progrès IA représente-t-il ? »
      </p>
      <p>
        Pour cela, il compte combien de doublements de capacité IA ont eu lieu depuis la sortie,
        puis réexprime ce nombre en années de génération technologique classique. C'est une
        heuristique volontairement simple, pas un benchmark de capacité rigoureux — voir les
        Limites ci-dessous.
      </p>
    </section>

    <section>
      <h2>Deux chiffres : base vs. accéléré</h2>
      <p>Le calculateur peut traiter le même couple sortie/date-d'évaluation de deux façons :</p>
      <ul>
        <li>
          <strong>Modèle base</strong> (<code>model: "base"</code>) — suppose que la capacité IA
          double à un rythme constant sur toute la période.
        </li>
        <li>
          <strong>Modèle accéléré</strong> (<code>model: "accelerating"</code>) — suppose que le
          temps de doublement lui-même diminue (le progrès IA s'accélère), si bien que les mois
          récents comptent pour plus de doublements que les anciens.
        </li>
      </ul>
      <p>
        Les deux modèles rapportent un nombre <code>aiDoublings</code> différent pour la même
        période ; le calculateur affiche les deux pour montrer à quel point l'hypothèse
        « est-ce que ça accélère ? » déplace la réponse.
      </p>
    </section>

    <section>
      <h2>Les termes D_classic / D_ai</h2>
      <p>
        Deux constantes pilotent le modèle base (<code>AtemParams</code>, valeurs par défaut dans{' '}
        <code>DEFAULT_PARAMS</code>) :
      </p>
      <dl className="methodology-params">
        <div>
          <dt>dClassicMonths (défaut 72)</dt>
          <dd>
            Le temps qu'une génération technologique « classique » mettait à doubler en capacité,
            avant l'IA (6 ans).
          </dd>
        </div>
        <div>
          <dt>dAiMonths (défaut 4.5)</dt>
          <dd>Le temps que prend un doublement de capacité IA, selon l'hypothèse du modèle base.</dd>
        </div>
      </dl>
      <p>
        <code>multiplier = dClassicMonths / dAiMonths</code> — avec les valeurs par défaut,{' '}
        <strong>16×</strong> : chaque doublement IA est traité comme valant 16× un doublement
        classique, parce que l'IA double ~16 fois plus vite.
      </p>

      <p>
        <strong>Modèle base</strong>, pour <code>months</code> écoulés depuis la sortie :
      </p>
      <pre className="methodology-formula">
        <code>{`aiDoublings      = months / dAiMonths
humanEquivYears  = (months * multiplier) / 12
                 = aiDoublings * dClassicMonths / 12`}</code>
      </pre>
      <p>
        autrement dit : on compte combien de doublements IA ont eu lieu, puis on dit que chacun
        « vaut » <code>dClassicMonths</code> de progrès classique.
      </p>

      <p>
        <strong>Le modèle accéléré</strong> remplace la division à taux constant par une
        intégration numérique : il parcourt de <code>release</code> à <code>asOf</code> en 400 pas
        et somme <code>Δmonths / D_ai(t)</code> à chaque pas (méthode des trapèzes), où{' '}
        <code>D_ai(t)</code> interpole linéairement de <strong>7 mois</strong> (ancré au
        2019-01-01) jusqu'à <strong>4 mois</strong> (ancré à <code>asOf</code>, c.-à-d. le
        « maintenant » de ce calcul). Le résultat est ensuite converti en années de la même façon :
      </p>
      <pre className="methodology-formula">
        <code>humanEquivYears = aiDoublings * dClassicMonths / 12</code>
      </pre>
      <p>
        Seule la manière de compter <code>aiDoublings</code> diffère entre les deux modèles — la
        conversion doublements-vers-années est identique.
      </p>
    </section>

    <section>
      <h2>Exemple détaillé</h2>
      <p>
        Outil : <strong>GPT-4</strong> (<code>gpt-4</code> dans <code>api/src/dataset.ts</code>),
        sorti le <strong>2023-03-14</strong>. Évalué au <strong>2025-01-01</strong>, modèle base,
        paramètres par défaut (<code>dClassicMonths=72</code>, <code>dAiMonths=4.5</code>).
      </p>
      <div className="methodology-table-wrap">
        <table className="methodology-table">
          <thead>
            <tr>
              <th>étape</th>
              <th>valeur</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>jours écoulés</td>
              <td>659</td>
            </tr>
            <tr>
              <td>mois écoulés (659 / 30.4368)</td>
              <td>≈ 21.65</td>
            </tr>
            <tr>
              <td>multiplicateur (72 / 4.5)</td>
              <td>16×</td>
            </tr>
            <tr>
              <td>aiDoublings (21.65 / 4.5)</td>
              <td>≈ 4.81</td>
            </tr>
            <tr>
              <td>humanEquivYears (21.65 × 16 / 12)</td>
              <td>≈ 28.9 ans</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Donc : dans les ~1 an 10 mois depuis la sortie de GPT-4 (à cette date), le modèle base
        d'ATEM estime que la capacité IA a progressé à peu près autant que ~28,9 ans de progrès
        logiciel au rythme classique l'auraient fait — soit environ 4,8 doublements de capacité
        IA, chacun compté comme valant 6 ans de progrès classique.
      </p>
      <p>
        Le même couple sortie/date-d'évaluation sous le modèle accéléré rapporterait un{' '}
        <em>aiDoublings différent</em> pour la partie la plus ancienne de cet intervalle, parce
        que <code>D_ai(t)</code> en 2023 est interpolé plus près de 7 mois (plus lent) que le taux
        de 4 mois proche de <code>asOf</code> ; les mois récents dominent. Lancez-le contre{' '}
        <code>/api/calc</code> pour voir le chiffre exact à n'importe quelle date.
      </p>
    </section>

    <section>
      <h2>Hypothèses et limites</h2>
      <p>
        À lire avant de traiter un chiffre ATEM comme une vraie prévision — c'est une heuristique
        au dos d'une enveloppe, pas un benchmark :
      </p>
      <ul className="methodology-limitations">
        <li>
          <strong>Les constantes de 4,5 mois et 72 mois sont des hypothèses, pas des mesures.</strong>{' '}
          Elles sont modifiables via <code>d_ai_months</code> / <code>d_classic_months</code> sur{' '}
          <code>/api/calc</code> ; les changer modifie linéairement tous les chiffres en aval.
        </li>
        <li>
          <strong>Le « doublement de capacité IA » n'est pas une quantité définie et mesurée.</strong>{' '}
          ATEM ne mesure aucun doublement réel de score de benchmark — il traite une cadence fixe
          (ou l'interpolation accélérée) comme un substitut à la croissance de capacité. Considérez
          la sortie comme un multiplicateur illustratif, pas comme une citation.
        </li>
        <li>
          <strong>
            L'interpolation D_ai du modèle accéléré ignore complètement le paramètre{' '}
            <code>dAiMonths</code>.
          </strong>{' '}
          <code>acceleratingDoublings()</code> utilise des ancrages codés en dur (7 mois au
          2019-01-01 → 4 mois à <code>asOf</code>) et ne lit jamais <code>params.dAiMonths</code>.
          Définir <code>d_ai_months</code> sur une requête en modèle accéléré ne change rien au
          résultat — cela n'affecte que le modèle base. C'est une réelle incohérence du code
          actuel, pas un choix de documentation.
        </li>
        <li>
          <strong>
            L'interpolation accélérée est relative à <code>asOf</code>, pas à la date actuelle
            réelle.
          </strong>{' '}
          L'ancrage « 4 mois » tombe toujours exactement sur la valeur d'<code>asOf</code> passée,
          même si <code>asOf</code> est dans le passé — les résultats en modèle accéléré pour un{' '}
          <code>as_of</code> historique ne correspondent donc pas à ce que le calculateur aurait
          donné à cette date-là.
        </li>
        <li>
          <strong>
            <code>dClassicMonths</code> (72 mois / 6 ans) est un chiffre unique et plat
          </strong>{' '}
          qui représente le rythme de toute l'industrie logicielle d'avant l'IA, lequel a
          évidemment varié selon la décennie, le secteur et l'entreprise.
        </li>
        <li>
          Les dates sont à minuit UTC et utilisent une durée de mois moyenne (<code>30.4368</code>{' '}
          jours) ; la précision au jour près des bornes de mois peut varier d'environ ~1 jour
          d'arrondi « humain » dans <code>monthsToHuman</code>.
        </li>
      </ul>
      <p className="methodology-bottom-line">
        En résumé : ATEM est un <strong>dispositif narratif</strong> pour rendre tangible la
        vitesse du progrès IA, bâti sur des hypothèses nommées et inspectables — pas une mesure
        scientifique de la capacité IA.
      </p>
    </section>
  </>
)

export const METHODOLOGY: Record<Locale, ReactNode> = { en, fr }
