import React from 'react'
import { cn } from '@/lib/utils'

export interface NavItemConfig {
  id: string
  label: string
  icon: React.ReactNode
}

interface SidebarProps {
  appName?: string
  appSubtitle?: string
  appInitials?: string
  items: NavItemConfig[]
  activeItemId?: string
  onItemClick?: (id: string) => void
  onLogout?: () => void
  className?: string
}

/**
 * Sidebar – The dark-green navigation sidebar used across all admin pages.
 *
 * @example
 * <Sidebar
 *   appName="Wellness Kit"
 *   appSubtitle="Admin Panel"
 *   appInitials="Wk"
 *   items={[
 *     { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
 *     { id: 'create-order', label: 'Create Order', icon: <PlusCircle size={18} /> },
 *     { id: 'import-csv', label: 'Import CSV', icon: <Upload size={18} /> },
 *   ]}
 *   activeItemId="create-order"
 *   onItemClick={(id) => navigate(id)}
 *   onLogout={() => logout()}
 * />
 */
export function Sidebar({
  appName = 'App',
  appSubtitle,
  appInitials = 'A',
  items,
  activeItemId,
  onItemClick,
  onLogout,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col w-48 h-full bg-[#4a7c59] text-white flex-shrink-0',
        className
      )}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white text-[#4a7c59] font-bold text-sm flex-shrink-0">
          {appInitials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight text-white truncate">{appName}</p>
          {appSubtitle && (
            <p className="text-xs text-green-200 truncate">{appSubtitle}</p>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 flex flex-col gap-1 mt-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick?.(item.id)}
            className={cn(
              'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-full text-sm transition-colors text-left',
              activeItemId === item.id
                ? 'bg-white text-[#4a7c59] font-semibold'
                : 'text-green-100 hover:bg-white/10'
            )}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4">
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-green-200 hover:text-white transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  )
}
