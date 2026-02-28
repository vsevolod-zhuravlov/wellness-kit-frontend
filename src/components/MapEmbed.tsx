import { cn } from '@/lib/utils'

interface MapEmbedProps {
  latitude: number
  longitude: number
  /** OSM zoom level 1-19, default 9 */
  zoom?: number
  className?: string
}

/**
 * MapEmbed – Renders an interactive OpenStreetMap iframe centered at the given
 * coordinates. Uses the OSM export URL which requires no API key.
 *
 * @example
 * <MapEmbed latitude={40.758} longitude={-73.9855} zoom={9} />
 */
export function MapEmbed({ latitude, longitude, zoom = 9, className }: MapEmbedProps) {
  // Build a bounding box around the coordinate for the OSM export iFrame
  const delta = 1.5 / zoom
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join(',')

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`

  return (
    <div className={cn('w-full rounded-xl overflow-hidden border border-gray-200', className)}>
      <iframe
        title="Map"
        src={src}
        className="w-full h-64 block"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  )
}
