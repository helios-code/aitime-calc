# ATEM Methodology

This explains exactly what the AI-Time Equivalence Model (ATEM) computes.
Source of truth: `api/src/atem.ts` (`computeAtem`) and `api/src/dataset.ts`.
If anything here ever drifts from the code, the code wins — file an issue.

## What ATEM measures

ATEM converts elapsed time since an AI tool's release into a **human-equivalent
time** figure: "how many years of pre-AI, classic-software-cadence progress
does this much AI progress represent?"

It does this by counting how many AI-capability doublings have happened since
release, then re-expressing that count in classic-tech-generation years. It is
a deliberately simple heuristic, not a rigorous capability benchmark — see
Limitations below.

## Two numbers: base vs. accelerating

The calculator can compute the same release/as-of pair two ways:

- **Base model** (`model: "base"`) — assumes AI capability doubles at a
  constant rate the whole time.
- **Accelerating model** (`model: "accelerating"`) — assumes the doubling
  time itself is shrinking (AI progress is speeding up), so recent months
  count for more doublings than older ones.

Both models report a different `aiDoublings` count for the same period; the
UI shows both so you can see how much the "is it accelerating?" assumption
moves the answer.

## The D_classic / D_ai terms

Two constants drive the base model (`AtemParams`, defaults in `DEFAULT_PARAMS`):

- `dClassicMonths` (default **72**) — how long one "classic" tech generation
  took to double in capability, pre-AI (6 years).
- `dAiMonths` (default **4.5**) — how long one AI-capability doubling takes,
  base-model assumption.

`multiplier = dClassicMonths / dAiMonths` — with the defaults, **16×**: every
AI doubling is treated as worth 16× a classic doubling, because AI doubles
~16 times faster.

**Base model**, for elapsed `months` since release:

```
aiDoublings      = months / dAiMonths
humanEquivYears  = (months * multiplier) / 12
                 = aiDoublings * dClassicMonths / 12
```

i.e. count how many AI doublings happened, then say each one "is worth"
`dClassicMonths` of classic progress.

**Accelerating model** replaces the constant-rate division with a numeric
integration: it walks from `release` to `asOf` in 400 steps and sums
`Δmonths / D_ai(t)` at each step (trapezoidal rule), where `D_ai(t)`
linearly interpolates from **7 months** (anchored at 2019-01-01) down to
**`dAiMonths`** (default 4.5, anchored at `asOf`, i.e. "now" for that
calculation). The result is still turned into years the same way:

```
humanEquivYears = aiDoublings * dClassicMonths / 12
```

Only how `aiDoublings` is counted differs between the two models — the
doublings-to-years conversion is identical.

## Worked example

Tool: **GPT-4** (`gpt-4` in `api/src/dataset.ts`), released **2023-03-14**.
Evaluated as of **2025-01-01**, base model, default params
(`dClassicMonths=72`, `dAiMonths=4.5`).

| step | value |
|---|---|
| elapsed days | 659 |
| elapsed months (659 / 30.4368) | ≈ 21.65 |
| multiplier (72 / 4.5) | 16× |
| aiDoublings (21.65 / 4.5) | ≈ 4.81 |
| humanEquivYears (21.65 × 16 / 12) | ≈ 28.9 years |

So: in the ~1 yr 10 mo since GPT-4 shipped (as of that date), ATEM's base
model says AI capability advanced roughly as far as ~28.9 years of
classic-cadence software progress would have — about 4.8 AI-capability
doublings, each counted as worth 6 years of classic progress.

The same release/as-of pair under the accelerating model would report a
*lower* `aiDoublings` for the earlier portion of that span, because
`D_ai(t)` back in 2023 is interpolated closer to 7 months (slower) than the
default 4.5-month rate near `asOf`; recent months dominate. Run it against
`/api/calc` to see the exact number for any date.

## Assumptions and limitations

Read this before treating any ATEM number as a real forecast — it's a
back-of-envelope heuristic, not a benchmark:

- **The 4.5-month and 72-month constants are assumptions, not measurements.**
  They're editable via `d_ai_months` / `d_classic_months` on `/api/calc`;
  changing them changes every downstream number linearly.
- **"AI-capability doubling" is not a defined, measured quantity.** ATEM
  doesn't measure any actual benchmark score doubling — it treats a fixed
  cadence (or the accelerating interpolation) as a stand-in for capability
  growth. Treat the output as an illustrative multiplier, not a citation.
- **The accelerating model's D_ai interpolation anchors on `dAiMonths`.**
  `acceleratingDoublings()` interpolates from 7 months (2019-01-01) down to
  `params.dAiMonths` at `asOf`. Setting `d_ai_months` on an accelerating-model
  request changes the "now" end of the curve, same as it does for the base
  model.
- **The accelerating interpolation is relative to `asOf`, not to the actual
  current date.** The "4 months" anchor always lands exactly at whatever
  `asOf` you pass, even if `asOf` is in the past — so accelerating-model
  results for a historical `as_of` are not what you'd have gotten by running
  the calculator on that date in the past.
- **`dClassicMonths` (72 months / 6 years) is a single flat number** standing
  in for the whole pre-AI software industry's pace, which obviously varied by
  decade, sector, and company.
- Dates are UTC midnight and use an average month length (`30.4368` days);
  day-level precision near month boundaries can be off by up to ~1 day of
  "human" rounding in `monthsToHuman`.

Bottom line: ATEM is a **narrative device** for making AI progress speed
tangible, built on named, inspectable assumptions — not a scientific
measurement of AI capability.
