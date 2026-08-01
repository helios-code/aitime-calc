import type { Tool } from '../types'

export type ToolGroups = Array<[category: string, tools: Tool[]]>

export function filterAndGroupTools(tools: Tool[], query: string): ToolGroups {
  const q = query.trim().toLowerCase()
  const filtered = q
    ? tools.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.vendor.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      )
    : tools
  const sorted = [...filtered].sort((a, b) => a.release_date.localeCompare(b.release_date))

  const map = new Map<string, Tool[]>()
  for (const t of sorted) {
    const arr = map.get(t.category) ?? []
    arr.push(t)
    map.set(t.category, arr)
  }
  return [...map.entries()]
}

export function flattenGroups(groups: ToolGroups): Tool[] {
  return groups.flatMap(([, items]) => items)
}
