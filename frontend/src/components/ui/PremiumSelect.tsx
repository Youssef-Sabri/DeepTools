'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface SelectOption<T extends string> {
  value: T
  label: string
}

interface PremiumSelectProps<T extends string> {
  id?: string
  ariaLabel?: string
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  className?: string
}

export function PremiumSelect<T extends string>({
  id,
  ariaLabel,
  value,
  options,
  onChange,
  className = '',
}: PremiumSelectProps<T>) {
  const generatedId = useId().replace(/:/g, '')
  const listId = `${generatedId}-options`
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = options[selectedIndex]

  useEffect(() => {
    if (!open) return
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePress)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress)
  }, [open])

  const choose = (index: number) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    setOpen(false)
    rootRef.current?.querySelector<HTMLButtonElement>('.premium-select-trigger')?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (options.length === 0) return
    if (event.key === 'Escape') {
      if (open) event.preventDefault()
      setOpen(false)
    } else if (event.key === 'Tab') {
      setOpen(false)
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      if (!open) {
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
        setOpen(true)
      } else if (event.key === 'Home') {
        setActiveIndex(0)
      } else if (event.key === 'End') {
        setActiveIndex(options.length - 1)
      } else {
        setActiveIndex((index) => (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length)
      }
    } else if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault()
      choose(activeIndex)
    }
  }

  return (
    <div ref={rootRef} className={`premium-select relative min-w-0 ${className}`}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
        className="premium-select-trigger flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2 text-start text-sm text-[var(--text)]"
        onClick={() => {
          setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
          setOpen((wasOpen) => !wasOpen)
        }}
        onKeyDown={onKeyDown}
      >
        <span className="min-w-0 truncate">{selected?.label ?? ariaLabel ?? ''}</span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="premium-select-menu absolute inset-x-0 top-[calc(100%+0.4rem)] z-50 max-h-64 overflow-y-auto rounded-xl p-1.5"
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === value}
              className={`premium-select-option flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${index === activeIndex ? 'is-active' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--blue-bright)]" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
