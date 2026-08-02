import { describe, expect, it } from 'vitest'
import { buildEmbedSnippet } from './embed'

describe('buildEmbedSnippet', () => {
  it('builds an iframe pointing at /embed with tool + model params', () => {
    const snippet = buildEmbedSnippet('https://aitime-calc.example', 'gpt-4o', 'base')
    expect(snippet).toContain('<iframe')
    expect(snippet).toContain('src="https://aitime-calc.example/embed?tool=gpt-4o&model=base"')
    expect(snippet).toContain('width="480"')
    expect(snippet).toContain('height="600"')
  })

  it('carries the accelerating model through', () => {
    const snippet = buildEmbedSnippet('https://aitime-calc.example', 'claude-3', 'accelerating')
    expect(snippet).toContain('model=accelerating')
  })
})
