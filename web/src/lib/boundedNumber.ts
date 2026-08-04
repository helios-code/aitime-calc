/**
 * Decides what a bounded numeric input should commit when the user leaves the
 * field, given the raw text they typed and the value currently in state.
 *
 * Unparseable text (an emptied field, "abc", a lone "-") keeps the current
 * value: clamping it to `min` instead would silently answer a question the user
 * never asked — d_ai_months=0.5 is a 144x multiplier, and it would ride along in
 * the share URL. In-range text commits as typed; out-of-range text clamps, which
 * is what the min/max attributes already promise.
 */
export function commitBoundedNumber(text: string, min: number, max: number, current: number): number {
  const parsed = Number.parseFloat(text)
  if (!Number.isFinite(parsed)) return current
  return Math.min(max, Math.max(min, parsed))
}
