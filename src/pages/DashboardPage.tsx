import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign, TrendingUp, FileText, Search, Loader2, RotateCcw } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { StatusBadge } from '@/components/StatusBadge'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useOrdersQuery, useOrderStatsQuery } from '@/hooks/useOrders'

const PAGE_SIZE_OPTIONS = [10, 20, 50].map((n) => ({ value: n, label: String(n) }))

function formatDate(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
  }
}

function formatCurrency(n: number) {
  return `$${n.toFixed(2)}`
}

export default function DashboardPage() {
  const navigate = useNavigate()

  // ── Pagination ────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1) // 1-indexed for UI
  const [pageSize, setPageSize] = useState(20)

  // ── Filters (Local only, backend doesn't support them currently) ──────────
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value)
    setPage(1)
  }

  const handleResetFilters = () => {
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setMinAmount('')
    setMaxAmount('')
    setPage(1)
  }

  const hasActiveFilters = Boolean(search || dateFrom || dateTo || minAmount || maxAmount)

  // ── React Query ───────────────────────────────────────────────────────────
  const { data: statsData, isLoading: statsLoading } = useOrderStatsQuery()
  // backend page is 0-indexed
  const { data: ordersData, isLoading: ordersLoading, isError } = useOrdersQuery(page - 1, pageSize, 'timestamp,desc')

  // Derive values
  const totalRevenue = statsData?.totalRevenue || 0
  const totalTaxCollected = statsData?.totalTax || 0
  const totalOrdersCount = statsData?.totalOrders || 0

  const orders = ordersData?.orders || []
  const pageInfo = ordersData?.pageInfo
  const totalPages = pageInfo?.totalPages || 1
  const currentPage = (pageInfo?.number || 0) + 1

  // Local filtering on the current page to keep the UI inputs functional
  const pageSlice = orders.filter((o) => {
    if (search && !o.id.toLowerCase().includes(search.toLowerCase())) return false
    if (dateFrom && new Date(o.timestamp) < new Date(dateFrom)) return false
    if (dateTo && new Date(o.timestamp) > new Date(dateTo + 'T23:59:59Z')) return false
    if (minAmount && o.total < parseFloat(minAmount)) return false
    if (maxAmount && o.total > parseFloat(maxAmount)) return false
    return true
  })

  return (
    <div className="p-8">
      {/* ── Page title ────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-gray-500">Manage your Wellness Kit orders</p>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Revenue"
          value={statsLoading ? '...' : formatCurrency(totalRevenue)}
          subtext={`From ${totalOrdersCount} orders`}
          icon={<DollarSign size={20} />}
        />
        <StatCard
          label="Total Tax Collected"
          value={statsLoading ? '...' : formatCurrency(totalTaxCollected)}
          subtext={statsLoading ? '...' : `${totalRevenue > 0 ? ((totalTaxCollected / totalRevenue) * 100).toFixed(2) : 0}% of revenue`}
          icon={<TrendingUp size={20} />}
        />
        <StatCard
          label="Total Orders"
          value={statsLoading ? '...' : String(totalOrdersCount)}
          subtext="All time"
          icon={<FileText size={20} />}
        />
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────── */}
      <div className="flex justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search Order ID (current page)"
              value={search}
              onChange={handleFilterChange(setSearch)}
              className="pl-8"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1.5 text-sm font-medium"
              title="Reset Filters"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <Input type="date" value={dateFrom} onChange={handleFilterChange(setDateFrom)} className="w-40 text-gray-500" title="Date from" />
          <Input type="date" value={dateTo} onChange={handleFilterChange(setDateTo)} className="w-40 text-gray-500" title="Date to" />
          <Input type="number" placeholder="Min Amount" value={minAmount} onChange={handleFilterChange(setMinAmount)} className="w-32" />
          <Input type="number" placeholder="Max Amount" value={maxAmount} onChange={handleFilterChange(setMaxAmount)} className="w-32" />
        </div>
      </div>

      {/* ── Orders table ──────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <Th>Order ID</Th>
                <Th>Timestamp</Th>
                <Th>Location</Th>
                <Th className="text-right">Subtotal</Th>
                <Th className="text-right">Tax Amount</Th>
                <Th className="text-right">Total Amount</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {ordersLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-gray-300" />
                    Loading orders...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-red-500">
                    Failed to load orders. Please try refreshing the page.
                  </td>
                </tr>
              ) : pageSlice.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                    No orders match your filters on this page.
                  </td>
                </tr>
              ) : (
                pageSlice.map((order) => {
                  const { date, time } = formatDate(order.timestamp)
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <Td className="font-medium text-gray-900">{order.id}</Td>
                      <Td>
                        <div className="text-gray-700">{date}</div>
                        <div className="text-gray-400 text-xs">{time}</div>
                      </Td>
                      <Td>
                        <div className="text-gray-700">{order.address}</div>
                        <div className="text-gray-400 text-xs">
                          {order.latitude.toFixed(4)}, {order.longitude.toFixed(4)}
                        </div>
                      </Td>
                      <Td className="text-right text-gray-700">{formatCurrency(order.subtotal)}</Td>
                      <Td className="text-right">
                        <div className="text-gray-700">{formatCurrency(order.taxAmount)}</div>
                        <div className="text-gray-400 text-xs">{(order.taxRate * 100).toFixed(3)}%</div>
                      </Td>
                      <Td className="text-right font-semibold text-gray-900">{formatCurrency(order.total)}</Td>
                      <Td><StatusBadge status={order.status} /></Td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination footer ───────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Rows per page:</span>
            <Select
              options={PAGE_SIZE_OPTIONS}
              value={pageSize}
              onChange={(v) => { setPageSize(v); setPage(1) }}
              aria-label="Rows per page"
            />
          </div>

          {/* Page info + prev/next */}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={cn(
                'px-3 py-1.5 rounded-full border text-sm font-medium transition-colors',
                currentPage === 1
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              )}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={cn(
                'px-3 py-1.5 rounded-full border text-sm font-medium transition-colors',
                currentPage === totalPages || totalPages === 0
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              )}
            >
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn('px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap', className)}>{children}</th>
}

function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('px-6 py-4 whitespace-nowrap align-top', className)}>{children}</td>
}

