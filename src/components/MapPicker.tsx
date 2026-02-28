import { useEffect, useRef, useState, useCallback } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Leaflet CSS must be loaded globally — we inject it once.
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'

function ensureLeafletCss() {
  if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = LEAFLET_CSS
    document.head.appendChild(link)
  }
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface MapPickerProps {
  latitude: number
  longitude: number
  /** Called whenever the user clicks the map or selects a search result */
  onLocationChange: (lat: number, lon: number, address?: string) => void
  /** Outer container height, defaults to 320px */
  height?: number
  className?: string
}

/**
 * MapPicker – Interactive Leaflet map that lets the user:
 * 1. Click anywhere on the map to drop a pin → updates lat/lon
 * 2. Type an address into the search box (Nominatim) → pick a result → updates lat/lon + pans map
 *
 * No API key required.
 *
 * @example
 * <MapPicker
 *   latitude={40.758}
 *   longitude={-73.9855}
 *   onLocationChange={(lat, lon, addr) => { setLat(lat); setLon(lon) }}
 * />
 */
export function MapPicker({ latitude, longitude, onLocationChange, height = 320, className }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Store Leaflet instances in refs to avoid re-creating them on each render
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null)

  // ── Search state ─────────────────────────────────────────────────────────
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Initialise Leaflet map (once) ─────────────────────────────────────────
  useEffect(() => {
    ensureLeafletCss()

    // Dynamic import so Leaflet isn't in the initial bundle
    import('leaflet').then((L) => {
      if (!containerRef.current || mapRef.current) return

      // Fix default icon paths that Vite mangles
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current!, { zoomControl: true }).setView([latitude, longitude], 11)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Initial marker
      const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map)

      // Click on map → move marker + notify parent
      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        onLocationChange(parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6)))
      })

      // Drag marker end → notify parent
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onLocationChange(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)))
      })

      mapRef.current = map
      markerRef.current = marker
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Keep marker in sync when lat/lon props change externally ─────────────
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    const current = markerRef.current.getLatLng()
    // Only move if meaningfully different to avoid fighting with click handler
    if (Math.abs(current.lat - latitude) > 0.0001 || Math.abs(current.lng - longitude) > 0.0001) {
      markerRef.current.setLatLng([latitude, longitude])
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom())
    }
  }, [latitude, longitude])

  // ── Address search (debounced) ─────────────────────────────────────────────
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (!value.trim()) {
      setResults([])
      setShowResults(false)
      return
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=6&addressdetails=1&countrycodes=us`
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'WellnessKitAdmin/1.0' },
        })
        const data: NominatimResult[] = await res.json()
        setResults(data)
        setShowResults(true)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }, [])

  const handleSelectResult = useCallback((result: NominatimResult) => {
    const lat = parseFloat(parseFloat(result.lat).toFixed(6))
    const lon = parseFloat(parseFloat(result.lon).toFixed(6))

    // Update marker + pan map
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lon])
      mapRef.current.setView([lat, lon], 13)
    }

    onLocationChange(lat, lon, result.display_name)
    setQuery(result.display_name)
    setShowResults(false)
    setResults([])
  }, [onLocationChange])

  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setShowResults(false)
  }, [])

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* ── Search bar ─────────────────────────────────────────────── */}
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#4a7c59]/30 focus-within:border-[#4a7c59] transition-all">
          {searching
            ? <Loader2 size={15} className="text-gray-400 flex-shrink-0 animate-spin" />
            : <Search size={15} className="text-gray-400 flex-shrink-0" />
          }
          <input
            type="text"
            placeholder="Search address…"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
          />
          {query && (
            <button onClick={clearSearch} className="text-gray-300 hover:text-gray-500 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {showResults && results.length > 0 && (
          <div className="absolute z-[9999] top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {results.map((r) => (
              <button
                key={r.place_id}
                onClick={() => handleSelectResult(r)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
              >
                <span className="block truncate">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Leaflet map container ───────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full rounded-xl overflow-hidden border border-gray-200 z-0"
      />

      <p className="text-xs text-gray-400">
        Click the map or drag the marker to set location. Only New York State coordinates are accepted.
      </p>
    </div>
  )
}
