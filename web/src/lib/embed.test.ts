import { describe, expect, it } from 'vitest'
import { buildEmbedSnippet } from './embed'
import { parseInitialState } from './urlParams'

function srcOf(snippet: string): string {
  return snippet.match(/src="([^"]+)"/)![1]
}

describe('buildEmbedSnippet', () => {
  it('builds an iframe pointing at /embed with tool + model params', () => {
    const snippet = buildEmbedSnippet('https://aitime-calc.example', { mode: 'tool', toolId: 'gpt-4o' }, 'base')
    expect(snippet).toContain('<iframe')
    expect(snippet).toContain('src="https://aitime-calc.example/embed?tool=gpt-4o&model=base"')
    expect(snippet).toContain('width="480"')
    expect(snippet).toContain('height="640"')
  })

  it('carries the accelerating model through', () => {
    const snippet = buildEmbedSnippet(
      'https://aitime-calc.example',
      { mode: 'tool', toolId: 'claude-3' },
      'accelerating',
    )
    expect(snippet).toContain('model=accelerating')
  })

  it('builds a date-mode iframe with ?date= and no ?tool=', () => {
    const snippet = buildEmbedSnippet('https://aitime-calc.example', { mode: 'date', date: '2024-05-13' }, 'base')
    expect(snippet).toContain('src="https://aitime-calc.example/embed?date=2024-05-13&model=base"')
    expect(snippet).not.toContain('tool=')
  })

  // The snippet is only useful if /embed parses it back to the same state.
  it('round-trips through parseInitialState in both modes', () => {
    const toolSearch = new URL(
      srcOf(buildEmbedSnippet('https://x.example', { mode: 'tool', toolId: 'gpt-4o' }, 'accelerating')),
    ).search
    expect(parseInitialState(toolSearch)).toMatchObject({ mode: 'tool', tool: 'gpt-4o', model: 'accelerating' })

    const dateSearch = new URL(srcOf(buildEmbedSnippet('https://x.example', { mode: 'date', date: '2024-05-13' }, 'base')))
      .search
    expect(parseInitialState(dateSearch)).toMatchObject({ mode: 'date', date: '2024-05-13', model: 'base' })
  })
})
