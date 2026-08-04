import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { Tool } from '../types'
import { filterAndGroupTools, flattenGroups } from '../lib/toolFilter'

interface Props {
  tools: Tool[]
  selectedId: string
  onChange: (id: string) => void
  /** Names this picker for screen readers. Pass a distinct label whenever a
      page renders more than one picker (Compare does) — two controls sharing
      one accessible name are indistinguishable in a rotor listing. */
  label?: string
}

export function ToolPicker({ tools, selectedId, onChange, label = 'Search known AI tools' }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /* Every id below is per-instance: a second picker on the same page would
     otherwise duplicate #tool-listbox and every #tool-option-*, and both
     inputs' aria-controls/aria-activedescendant would resolve to the FIRST
     picker's nodes. .tool-listbox styling keys off the class, not the id. */
  const uid = useId()
  const listboxId = `tool-listbox-${uid}`
  const optionId = (id: string) => `tool-option-${uid}-${id}`

  const selected = tools.find((t) => t.id === selectedId)

  const groups = useMemo(() => filterAndGroupTools(tools, query), [tools, query])
  const flatOrder = useMemo(() => flattenGroups(groups), [groups])
  const activeTool = flatOrder[activeIndex]

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  useEffect(() => {
    if (!open || !activeTool) return
    listRef.current?.querySelector(`#${CSS.escape(optionId(activeTool.id))}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, activeTool])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function commit(tool: Tool) {
    onChange(tool.id)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, flatOrder.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeTool) commit(activeTool)
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  let flatIndex = -1

  return (
    <div className="tool-picker" ref={rootRef}>
      <div className="tool-combobox">
        <input
          ref={inputRef}
          className="tool-input"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={open && activeTool ? optionId(activeTool.id) : undefined}
          aria-label={label}
          placeholder="Search AI tools…"
          value={open ? query : (selected?.name ?? '')}
          onFocus={() => {
            setOpen(true)
            setQuery('')
          }}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onKeyDown={onKeyDown}
        />
        {open && flatOrder.length === 0 && (
          <p className="tool-empty" role="status">
            No tools match "{query}"
          </p>
        )}
        {open && flatOrder.length > 0 && (
          <ul className="tool-listbox" id={listboxId} role="listbox" aria-label={label} ref={listRef}>
            {groups.map(([category, items]) => (
              <li key={category} role="group" aria-label={category} className="tool-group">
                <span className="tool-group-label" aria-hidden="true">
                  {category}
                </span>
                <ul>
                  {items.map((t) => {
                    const idx = (flatIndex += 1)
                    const isActive = idx === activeIndex
                    return (
                      <li
                        key={t.id}
                        id={optionId(t.id)}
                        role="option"
                        aria-selected={t.id === selectedId}
                        className={isActive ? 'tool-option tool-option--active' : 'tool-option'}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => commit(t)}
                      >
                        <span className="tool-option-name">{t.name}</span>
                        <span className="tool-option-meta">
                          {t.vendor} · {t.release_date}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selected?.note && !open && <p className="tool-note">{selected.note}</p>}
    </div>
  )
}
