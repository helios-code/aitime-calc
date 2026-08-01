import { describe, expect, it } from 'vitest'
import { filterAndGroupTools, flattenGroups } from './toolFilter'
import type { Tool } from '../types'

const TOOLS: Tool[] = [
  { id: 'gpt-4o', name: 'GPT-4o', vendor: 'OpenAI', release_date: '2024-05-13', category: 'LLM' },
  { id: 'gpt-4', name: 'GPT-4', vendor: 'OpenAI', release_date: '2023-03-14', category: 'LLM' },
  { id: 'claude-3', name: 'Claude 3', vendor: 'Anthropic', release_date: '2024-03-04', category: 'LLM' },
  { id: 'cursor-yolo', name: 'Cursor "YOLO mode"', vendor: 'Anysphere', release_date: '2024-11-01', category: 'coding agent' },
]

describe('filterAndGroupTools', () => {
  it('returns every tool grouped by category when the query is empty', () => {
    const groups = filterAndGroupTools(TOOLS, '')
    expect(flattenGroups(groups)).toHaveLength(TOOLS.length)
  })

  it('orders tools within a group by release date, oldest first', () => {
    const groups = filterAndGroupTools(TOOLS, '')
    const llmGroup = groups.find(([category]) => category === 'LLM')
    expect(llmGroup?.[1].map((t) => t.id)).toEqual(['gpt-4', 'claude-3', 'gpt-4o'])
  })

  it('filters case-insensitively across name, vendor, and category', () => {
    expect(flattenGroups(filterAndGroupTools(TOOLS, 'anthropic'))).toEqual([TOOLS[2]])
    expect(flattenGroups(filterAndGroupTools(TOOLS, 'CODING AGENT'))).toEqual([TOOLS[3]])
    expect(flattenGroups(filterAndGroupTools(TOOLS, 'gpt-4o'))).toEqual([TOOLS[0]])
  })

  it('returns no groups when nothing matches', () => {
    expect(filterAndGroupTools(TOOLS, 'nonexistent-tool-xyz')).toEqual([])
  })

  it('ignores surrounding whitespace in the query', () => {
    expect(flattenGroups(filterAndGroupTools(TOOLS, '  cursor  '))).toEqual([TOOLS[3]])
  })
})
