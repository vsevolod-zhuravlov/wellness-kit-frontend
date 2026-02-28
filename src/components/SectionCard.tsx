import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title?: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  /** Extra Tailwind classes for the inner CardContent */
  contentClassName?: string
}

/**
 * SectionCard – A white, rounded card container with an optional icon + title header.
 * This is the primary layout container used for "Order Details", "Tax Calculation",
 * "Financial Summary", "Tax Breakdown", "Delivery Location", etc.
 *
 * @example
 * <SectionCard title="Order Details">
 *   <FormField label="Latitude" ... />
 * </SectionCard>
 *
 * // With icon:
 * <SectionCard title="Select Location" icon={<MapPin size={16} />}>
 *   <MapEmbed latitude={40.76} longitude={-73.99} />
 * </SectionCard>
 */
export function SectionCard({ title, icon, children, className, contentClassName }: SectionCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      {title && (
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            {icon && <span className="text-gray-500">{icon}</span>}
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(title ? '' : 'pt-6', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
