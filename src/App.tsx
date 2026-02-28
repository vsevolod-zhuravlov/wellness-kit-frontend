import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/layouts/AppLayout'
import DashboardPage from '@/pages/DashboardPage'
import CreateOrderPage from '@/pages/CreateOrderPage'
import OrderDetailPage from '@/pages/OrderDetailPage'
import ImportCsvPage from '@/pages/ImportCsvPage'
import LoginPage from '@/pages/LoginPage'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

const queryClient = new QueryClient()

/**
 * Higher-order component to protect routes that require authentication
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

/**
 * Higher-order component to wrap AppLayout for protected pages
 */
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/create-order" element={<CreateOrderPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/import-csv" element={<ImportCsvPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </ProtectedRoute>
  )
}

/**
 * App – Root router and providers configuration.
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            {/* All other routes are nested inside ProtectedLayout */}
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
