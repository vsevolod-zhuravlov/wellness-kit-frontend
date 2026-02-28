import { type ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  subtext?: string
  icon?: ReactNode
  className?: string
}

/**
 * StatCard – A metric summary card with a label, large value, optional sub-text
 * and optional icon. Used in the dashboard header row.
 *
 * @example
 * <StatCard
 *   label="Total Revenue"
 *   value="$7,728.71"
 *   subtext="From 25 orders"
 *   icon={<DollarSign size={20} className="text-gray-400" />}
 * />
 */
export function StatCard({ label, value, subtext, icon, className }: StatCardProps) {
  return (
    <Card className={cn('flex flex-col gap-3 p-6', className)}>
      <div className="flex items-start justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
        {subtext && <p className="mt-1 text-sm text-gray-400">{subtext}</p>}
      </div>
    </Card>
  )
}
