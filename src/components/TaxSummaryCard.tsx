import React from 'react'
import { SectionCard } from '@/components/SectionCard'
import { cn } from '@/lib/utils'

interface TaxSummaryData {
  subtotal: number
  /** Composite tax rate as a decimal, e.g. 0.08875 for 8.875% */
  taxRate: number
  taxAmount: number
  total: number
  /** Button element to render at the bottom of the card (e.g. OutlineButton) */
  action?: React.ReactNode
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(3)}%`
}

/**
 * TaxSummaryCard – Displays calculated tax breakdown with subtotal, tax rate,
 * tax amount, and total. Shown after clicking "Calculate Tax" on the Create Order page.
 *
 * @example
 * <TaxSummaryCard
 *   subtotal={123}
 *   taxRate={0.08875}
 *   taxAmount={10.92}
 *   total={133.92}
 *   action={<OutlineButton onClick={handleSave}>Confirm & Save Order</OutlineButton>}
 * />
 */
export function TaxSummaryCard({ subtotal, taxRate, taxAmount, total, action }: TaxSummaryData) {
  return (
    <SectionCard title="Tax Calculation">
      <div className="flex flex-col gap-3">
        <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
        <SummaryRow label="Composite Tax Rate" value={formatPercent(taxRate)} />
        <SummaryRow label="Tax Amount" value={formatCurrency(taxAmount)} />
        <div className="border-t border-gray-100 pt-3">
          <SummaryRow
            label="Total Amount"
            value={formatCurrency(total)}
            valueClassName="text-[#4a7c59] font-bold text-lg"
            labelClassName="font-semibold text-gray-900"
          />
        </div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </SectionCard>
  )
}

/**
 * FinancialSummaryCard – Order detail page variant of TaxSummaryCard.
 * Same structure but used as a standalone right-column card with a border.
 *
 * @example
 * <FinancialSummaryCard
 *   subtotal={263}
 *   taxRate={0.0775}
 *   taxAmount={20.38}
 *   total={283.38}
 * />
 */
export function FinancialSummaryCard({ subtotal, taxRate, taxAmount, total }: Omit<TaxSummaryData, 'action'>) {
  return (
    <SectionCard title="Financial Summary">
      <div className="flex flex-col gap-3">
        <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
        <SummaryRow label="Composite Tax Rate" value={formatPercent(taxRate)} />
        <SummaryRow label="Tax Amount" value={formatCurrency(taxAmount)} />
        <div className="border-t border-gray-100 pt-3">
          <SummaryRow
            label="Total Amount"
            value={formatCurrency(total)}
            valueClassName="text-[#4a7c59] font-bold text-lg"
            labelClassName="font-semibold text-gray-900"
          />
        </div>
      </div>
    </SectionCard>
  )
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  labelClassName,
  valueClassName,
}: {
  label: string
  value: string
  labelClassName?: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-sm text-gray-500', labelClassName)}>{label}</span>
      <span className={cn('text-sm text-gray-900 font-medium', valueClassName)}>{value}</span>
    </div>
  )
}
