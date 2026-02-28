import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type OrderStatus = 'Completed' | 'Pending' | 'Cancelled' | 'Processing' | string

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

function getVariant(status: OrderStatus) {
  switch (status.toLowerCase()) {
    case 'completed': return 'success'
    case 'pending': return 'warning'
    case 'cancelled': return 'destructive'
    default: return 'default'
  }
}

/**
 * StatusBadge – A colored pill badge that encodes order status.
 * Green for Completed, yellow for Pending, red for Cancelled.
 *
 * @example
 * <StatusBadge status="Completed" />
 * <StatusBadge status="Pending" />
 * <StatusBadge status="Cancelled" />
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={getVariant(status)} className={cn('capitalize', className)}>
      {status}
    </Badge>
  )
}
