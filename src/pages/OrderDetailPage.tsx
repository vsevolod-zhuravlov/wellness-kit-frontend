import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Loader2 } from 'lucide-react'
import { LocationCard } from '@/components/LocationCard'
import { FinancialSummaryCard } from '@/components/TaxSummaryCard'
import { TaxBreakdownTable } from '@/components/TaxBreakdownTable'
import { StatusBadge } from '@/components/StatusBadge'
import { useOrderQuery } from '@/hooks/useOrders'



function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: order, isLoading, isError } = useOrderQuery(id || '')

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center flex-col min-h-[60vh] text-gray-400">
        <Loader2 size={32} className="animate-spin mb-4" />
        <p>Loading order details...</p>
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="p-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
        <div className="text-center py-16 text-red-500 text-sm">
          Failed to load order <span className="font-semibold">{id}</span>.
        </div>
      </div>
    )
  }



  return (
    <div className="p-8">
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.id}</h1>
          {order.wellnessType && (
            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              {order.wellnessType.charAt(0).toUpperCase() + order.wellnessType.slice(1)}
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-400">
            <Clock size={14} />
            <span>{formatDateTime(order.timestamp)}</span>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-6 items-start">
        {/* Left: delivery location */}
        <LocationCard
          address={order.address}
          latitude={order.latitude}
          longitude={order.longitude}
          state="New York"
          zoom={9}
        />

        {/* Right: financial + tax breakdown stacked */}
        <div className="flex flex-col gap-6">
          <FinancialSummaryCard
            subtotal={order.subtotal}
            taxRate={order.taxRate}
            taxAmount={order.taxAmount}
            total={order.total}
          />
          <TaxBreakdownTable rows={order.taxBreakdown} />
        </div>
      </div>
    </div>
  )
}
