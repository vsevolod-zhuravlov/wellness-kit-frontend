import { type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, Upload } from 'lucide-react'
import { Sidebar } from '@/components'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { id: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: '/create-order', label: 'Create Order', icon: <PlusCircle size={18} /> },
  { id: '/import-csv', label: 'Import CSV', icon: <Upload size={18} /> },
]

interface AppLayoutProps {
  children: ReactNode
}

/**
 * AppLayout – Shared layout shell: dark-green Sidebar on the left,
 * scrollable main content on the right.
 *
 * All page routes should be wrapped in this layout via the router.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { logout } = useAuth()

  // Match current path to a nav item
  const activeId = NAV_ITEMS.find((item) => item.id === pathname)?.id ?? '/'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 font-sans">
      <Sidebar
        appName="Wellness Kit"
        appSubtitle="Admin Panel"
        appInitials="Wk"
        items={NAV_ITEMS}
        activeItemId={activeId}
        onItemClick={(id) => navigate(id)}
        onLogout={logout}
      />
      <main className="flex-1 h-full overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
