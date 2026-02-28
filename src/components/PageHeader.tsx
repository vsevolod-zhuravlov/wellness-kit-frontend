import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backLabel?: string
  onBack?: () => void
  className?: string
}

/**
 * PageHeader – Displays a back navigation link, a page title, and an optional subtitle.
 * Used at the top of every main content page.
 *
 * @example
 * <PageHeader
 *   title="Create Order"
 *   subtitle="Enter location and order details to calculate tax"
 *   backLabel="Back to Dashboard"
 *   onBack={() => navigate('/')}
 * />
 */
export function PageHeader({ title, subtitle, backLabel = 'Back', onBack, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {backLabel && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
        >
          <ArrowLeft size={15} />
          {backLabel}
        </button>
      )}
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  )
}
