import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SectionCard } from '@/components/SectionCard'

export interface TaxBreakdownRow {
  jurisdiction: string
  /** Rate as a decimal, e.g. 0.04 for 4.000% */
  rate: number
  amount: number
}

interface TaxBreakdownTableProps {
  rows: TaxBreakdownRow[]
}

/**
 * TaxBreakdownTable – Shows per-jurisdiction tax rates and amounts with a green
 * total row. Displayed on the order detail page.
 *
 * @example
 * <TaxBreakdownTable
 *   rows={[
 *     { jurisdiction: 'New York State', rate: 0.04, amount: 10.52 },
 *     { jurisdiction: 'Country', rate: 0.0375, amount: 9.86 },
 *   ]}
 * />
 */
export function TaxBreakdownTable({ rows }: TaxBreakdownTableProps) {
  const totalRate = rows.reduce((sum, r) => sum + r.rate, 0)
  const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0)

  return (
    <SectionCard title="Tax Breakdown" contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Jurisdiction</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.jurisdiction}>
              <TableCell>{row.jurisdiction}</TableCell>
              <TableCell className="text-right">{(row.rate * 100).toFixed(3)}%</TableCell>
              <TableCell className="text-right">${row.amount.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="hover:bg-transparent">
            <TableCell className="font-semibold text-gray-900">Total</TableCell>
            <TableCell className="text-right font-semibold text-gray-900">
              {(totalRate * 100).toFixed(3)}%
            </TableCell>
            <TableCell className="text-right font-semibold text-gray-900">
              ${totalAmount.toFixed(2)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </SectionCard>
  )
}
