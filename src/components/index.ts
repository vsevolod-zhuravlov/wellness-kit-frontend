/**
 * @module components
 *
 * Barrel re-export of all custom application components.
 * Import from here to keep imports tidy:
 *
 * @example
 * import { Sidebar, PageHeader, FormField, SectionCard, PrimaryButton } from '@/components'
 */

// ─── Layout ──────────────────────────────────────────────────────────────────
export { Sidebar } from './Sidebar'
export type { NavItemConfig } from './Sidebar'

// ─── Page structure ───────────────────────────────────────────────────────────
export { PageHeader } from './PageHeader'
export { SectionCard } from './SectionCard'

// ─── Form ────────────────────────────────────────────────────────────────────
export { FormField, FormError } from './FormField'

// ─── Buttons ─────────────────────────────────────────────────────────────────
export { PrimaryButton, OutlineButton, DarkButton } from './Buttons'

// ─── Data display ────────────────────────────────────────────────────────────
export { TaxSummaryCard, FinancialSummaryCard } from './TaxSummaryCard'
export { TaxBreakdownTable } from './TaxBreakdownTable'
export type { TaxBreakdownRow } from './TaxBreakdownTable'
export { StatusBadge } from './StatusBadge'
export { StatCard } from './StatCard'

// ─── States ──────────────────────────────────────────────────────────────────
export { SuccessState } from './SuccessState'

// ─── Map & Location ──────────────────────────────────────────────────────────
export { MapEmbed } from './MapEmbed'
export { LocationCard } from './LocationCard'
export { MapPicker } from './MapPicker'

// ─── shadcn/ui primitives (re-exported for convenience) ──────────────────────
export { Button, buttonVariants } from './ui/button'
export type { ButtonProps } from './ui/button'
export { Input } from './ui/input'
export { Label } from './ui/label'
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card'
export { Badge, badgeVariants } from './ui/badge'
export type { BadgeProps } from './ui/badge'
export { Select } from './ui/select'
export type { SelectOption } from './ui/select'
export {
  Table, TableHeader, TableBody, TableFooter,
  TableHead, TableRow, TableCell, TableCaption,
} from './ui/table'
