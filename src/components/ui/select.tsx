import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption<T extends string | number = string> {
  label: string
  value: T
}

interface SelectProps<T extends string | number = string> {
  options: SelectOption<T>[]
  value: T
  onChange: (value: T) => void
  placeholder?: string
  className?: string
  id?: string
  'aria-label'?: string
}

export function Select<T extends string | number = string>({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  className,
  id,
  'aria-label': ariaLabel,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0, dropUp: false })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLUListElement>(null)

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder

  const updateCoords = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      const dropUp = window.innerHeight - rect.bottom < 200 // if there's less than 200px below, drop up
      setCoords({
        top: rect.bottom + 4,
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
        dropUp,
      })
    }
  }, [])

  const handleOpen = () => {
    updateCoords()
    setOpen((v) => !v)
  }

  // Close when clicking outside the whole component (trigger + popover)
  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !popoverRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // Close on Escape or scroll
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handleEsc)
    window.addEventListener('scroll', close, true) // capture scroll anywhere to close (coords become stale)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('keydown', handleEsc)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={handleOpen}
        className={cn(
          'flex items-center gap-2 h-9 pl-3 pr-2.5 rounded-full border border-gray-200 bg-white',
          'text-sm text-gray-700 font-medium whitespace-nowrap cursor-pointer transition-colors select-none',
          'hover:border-gray-300',
          open && 'ring-2 ring-[#4a7c59] border-transparent',
        )}
      >
        <span>{selectedLabel}</span>
        <ChevronDown
          size={13}
          className={cn('text-gray-400 transition-transform duration-150', open && 'rotate-180')}
        />
      </button>

      {/* Popover */}
      {open && typeof document !== 'undefined' && createPortal(
        <ul
          ref={popoverRef}
          role="listbox"
          aria-label={ariaLabel}
          style={{
            position: 'fixed',
            [coords.dropUp ? 'bottom' : 'top']: coords.dropUp ? coords.bottom : coords.top,
            left: coords.left,
            minWidth: coords.width,
          }}
          className="z-[9999] rounded-xl border border-gray-100 bg-white shadow-xl py-1 transform translate-y-0"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={cn(
                  'flex items-center justify-between gap-3 px-3 py-2 text-sm cursor-pointer transition-colors',
                  isSelected
                    ? 'text-[#4a7c59] font-medium bg-green-50'
                    : 'text-gray-700 hover:bg-gray-50',
                )}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={13} className="text-[#4a7c59] flex-shrink-0" />}
              </li>
            )
          })}
        </ul>,
        document.body
      )}
    </div>
  )
}
