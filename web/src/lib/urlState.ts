import type { CalcModel } from '../types'
import { resolveToolId } from '../data/tools'
import { isPlausibleToolId, isValidDateStr } from './urlParams'

// Shareable-permalink encode/decode for the Compare (/compare) and Timeline
// (/timeline) views. Pure functions — the React history wiring lives in the
// pages and calls syncSearch(). Validation is delegated to urlParams so the
// single-tool permalink contract and these stay in lockstep.
//
// Graceful degradation is the rule everywhere: an unknown/invalid param never
// throws, it falls back to the caller-supplied default. Tool-id *membership*
// (does this id exist in the live dataset?) is still the page's call once
// fetchTools resolves — here we only syntax-check and alias-resolve.

function readModel(params: URLSearchParams): CalcModel {
  return params.get('model') === 'accelerating' ? 'accelerating' : 'base'
}

function readTool(params: URLSearchParams, key: string): string | null {
  const raw = params.get(key)
  return raw && isPlausibleToolId(raw) ? resolveToolId(raw) : null
}

// Build a query string ('?a=1&b=2' or '' when empty), dropping null/undefined/
// empty values. Key order is fixed by the caller's insertion order so encoding
// is deterministic — a given state always produces the same string.
function toSearch(entries: Array<[string, string | null | undefined]>): string {
  const params = new URLSearchParams()
  for (const [k, v] of entries) {
    if (v !== null && v !== undefined && v !== '') params.set(k, v)
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

// ---- Compare (/compare) ----

export interface CompareUrlState {
  a: string | null
  b: string | null
  model: CalcModel
  asOf: string | null
}

export function decodeCompare(search: string): CompareUrlState {
  const params = new URLSearchParams(search)
  const rawAsOf = params.get('as_of')
  return {
    a: readTool(params, 'tool'),
    b: readTool(params, 'vs'),
    model: readModel(params),
    asOf: rawAsOf && isValidDateStr(rawAsOf) ? rawAsOf : null,
  }
}

export function encodeCompare(state: {
  a: string
  b: string
  model: CalcModel
  asOf?: string | null
}): string {
  return toSearch([
    ['tool', state.a],
    ['vs', state.b],
    ['model', state.model === 'accelerating' ? 'accelerating' : null],
    ['as_of', state.asOf ?? null],
  ])
}

// ---- Timeline (/timeline) ----

export interface TimelineUrlState {
  model: CalcModel
}

export function decodeTimeline(search: string): TimelineUrlState {
  return { model: readModel(new URLSearchParams(search)) }
}

export function encodeTimeline(state: { model: CalcModel }): string {
  return toSearch([['model', state.model === 'accelerating' ? 'accelerating' : null]])
}

// ---- Shareable-link language ----

// Append the active locale as ?lang so a shared permalink opens in the same
// language the sharer is viewing. English is the default and left implicit —
// same rule as encode* dropping the default model/as_of, keeping URLs clean.
// `locale` is 'lang' per i18n.LANG_PARAM (kept a literal here so urlState stays
// dependency-free and purely testable). Never throws.
export function appendLang(search: string, locale: string): string {
  if (locale === 'en') return search
  const params = new URLSearchParams(search)
  params.set('lang', locale)
  return `?${params.toString()}`
}

// ---- History wiring ----

// Write `search` (a '?...'-prefixed string or '') to the address bar without a
// reload. 'push' adds a history entry (so Back returns to the prior view);
// 'replace' rewrites the current entry (used to canonicalize on first load).
// No-op outside a browser (SSR / test environments without window.history).
export function syncSearch(search: string, mode: 'push' | 'replace'): void {
  if (typeof window === 'undefined' || !window.history) return
  const url = `${window.location.pathname}${search}${window.location.hash}`
  if (mode === 'push') window.history.pushState(null, '', url)
  else window.history.replaceState(null, '', url)
}
