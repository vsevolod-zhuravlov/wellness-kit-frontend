import { MapEmbed } from '@/components/MapEmbed'
import { SectionCard } from '@/components/SectionCard'
import { MapPin } from 'lucide-react'

interface LocationCardProps {
  /** Display address, e.g. "Albany, NY" */
  address?: string
  latitude: number
  longitude: number
  /** State name, e.g. "New York" */
  state?: string
  /** OSM map zoom level */
  zoom?: number
  className?: string
}

/**
 * LocationCard – Displays a map with an address metadata row underneath.
 * Used on the order detail page ("Delivery Location") and indirectly on
 * Create Order ("Select Location" — pass without address/state for map-only mode).
 *
 * @example
 * // Full card with metadata:
 * <LocationCard
 *   address="Albany, NY"
 *   latitude={42.6526}
 *   longitude={-73.7562}
 *   state="New York"
 * />
 *
 * // Map selection mode (no metadata):
 * <LocationCard latitude={40.758} longitude={-73.9855} zoom={8} />
 */
export function LocationCard({ address, latitude, longitude, state, zoom = 9, className }: LocationCardProps) {
  const hasMetadata = !!(address || state)

  return (
    <SectionCard
      title="Delivery Location"
      icon={<MapPin size={16} />}
      className={className}
      contentClassName="pt-2"
    >
      <MapEmbed latitude={latitude} longitude={longitude} zoom={zoom} />

      {hasMetadata && (
        <div className="grid grid-cols-4 gap-4 mt-4">
          <MetaItem label="Address" value={address ?? '—'} />
          <MetaItem label="Latitude" value={latitude.toFixed(6)} />
          <MetaItem label="Longitude" value={longitude.toFixed(6)} />
          <MetaItem label="State" value={state ?? '—'} />
        </div>
      )}
    </SectionCard>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  )
}
