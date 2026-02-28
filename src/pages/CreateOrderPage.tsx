import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'
import { FormField } from '@/components/FormField'
import { PrimaryButton, OutlineButton } from '@/components/Buttons'
import { TaxSummaryCard } from '@/components/TaxSummaryCard'
import { SuccessState } from '@/components/SuccessState'
import { SectionCard } from '@/components/SectionCard'
import { MapPicker } from '@/components/MapPicker'
import { useCreateOrderMutation } from '@/hooks/useOrders'
import { Loader2 } from 'lucide-react'

// ── New York state bounding box (rough) ───────────────────────────────────────
const NY_BOUNDS = {
  latMin: 40.4960,
  latMax: 45.0160,
  lonMin: -79.7633,
  lonMax: -71.8567,
}

function isInNYBounds(lat: number, lon: number): boolean {
  return (
    lat >= NY_BOUNDS.latMin &&
    lat <= NY_BOUNDS.latMax &&
    lon >= NY_BOUNDS.lonMin &&
    lon <= NY_BOUNDS.lonMax
  )
}

async function reverseGeocodeState(lat: number, lon: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'WellnessKitAdmin/1.0' },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data?.address?.state ?? null
}

function calculateTax(subtotal: number, lat: number, lon: number) {
  const isNYCMetro = lat < 41.5 && lon > -74.5
  const taxRate = isNYCMetro ? 0.08875 : 0.08
  const taxAmount = parseFloat((subtotal * taxRate).toFixed(2))
  const total = parseFloat((subtotal + taxAmount).toFixed(2))
  return { taxRate, taxAmount, total }
}

function generateOrderId() {
  return `ORD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
}

// ─────────────────────────────────────────────────────────────────────────────

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid'

// Default: Times Square, NYC
const DEFAULT_LAT = 40.758
const DEFAULT_LON = -73.9855

export default function CreateOrderPage() {
  const navigate = useNavigate()
  const createMutation = useCreateOrderMutation()

  // Form state — stored as strings so inputs stay editable
  const [latStr, setLatStr] = useState(String(DEFAULT_LAT))
  const [lonStr, setLonStr] = useState(String(DEFAULT_LON))
  const [subtotal, setSubtotal] = useState('')

  // Coordinate validation
  const [validationState, setValidationState] = useState<ValidationState>('idle')
  const [validationError, setValidationError] = useState<string | null>(null)

  // Tax result
  const [taxResult, setTaxResult] = useState<{ taxRate: number; taxAmount: number; total: number } | null>(null)

  // Saved order (success screen)
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null)

  // Parsed numbers for passing to MapPicker (fall back to defaults when input is invalid)
  const mapLat = parseFloat(latStr) || DEFAULT_LAT
  const mapLon = parseFloat(lonStr) || DEFAULT_LON

  // ── Map location picked ────────────────────────────────────────────────────

  const handleLocationChange = useCallback((lat: number, lon: number) => {
    setLatStr(String(lat))
    setLonStr(String(lon))
    // Reset validation so user must re-calculate tax after moving pin
    setValidationState('idle')
    setValidationError(null)
    setTaxResult(null)
  }, [])

  // ── Manual coordinate input change ────────────────────────────────────────

  const handleLatChange = (val: string) => {
    setLatStr(val)
    setValidationState('idle')
    setValidationError(null)
    setTaxResult(null)
  }

  const handleLonChange = (val: string) => {
    setLonStr(val)
    setValidationState('idle')
    setValidationError(null)
    setTaxResult(null)
  }

  // ── Coordinate validation ─────────────────────────────────────────────────

  const validateCoordinates = useCallback(async (): Promise<boolean> => {
    const lat = parseFloat(latStr)
    const lon = parseFloat(lonStr)

    if (isNaN(lat) || isNaN(lon)) {
      setValidationState('invalid')
      setValidationError('Please enter valid numeric coordinates.')
      return false
    }

    if (!isInNYBounds(lat, lon)) {
      setValidationState('invalid')
      setValidationError('Coordinates are outside New York State bounds. Only NY locations are accepted.')
      return false
    }

    setValidationState('validating')
    setValidationError(null)

    const state = await reverseGeocodeState(lat, lon)

    if (state === 'New York') {
      setValidationState('valid')
      setValidationError(null)
      return true
    } else {
      setValidationState('invalid')
      setValidationError(
        state
          ? `Location is in ${state}, not New York State. Only NY locations are accepted.`
          : 'Could not verify location. Please check coordinates and try again.'
      )
      return false
    }
  }, [latStr, lonStr])

  // ── Calculate Tax ─────────────────────────────────────────────────────────

  const handleCalculateTax = async () => {
    setTaxResult(null)
    const isValid = await validateCoordinates()
    if (!isValid) return

    const sub = parseFloat(subtotal)
    if (isNaN(sub) || sub <= 0) {
      setValidationError('Please enter a valid subtotal amount.')
      return
    }

    const result = calculateTax(sub, parseFloat(latStr), parseFloat(lonStr))
    setTaxResult(result)
  }

  // ── Save Order ────────────────────────────────────────────────────────────

  const handleSaveOrder = () => {
    if (!taxResult) return
    const id = generateOrderId()

    createMutation.mutate(
      {
        id,
        longitude: parseFloat(lonStr),
        latitude: parseFloat(latStr),
        subtotal: parseFloat(subtotal),
        timestamp: new Date().toISOString(),
        // wellnessType if needed
      },
      {
        onSuccess: () => {
          setSavedOrderId(id)
        },
        onError: (err: Error) => {
          setValidationError(err.message || 'Failed to save order to backend.')
          setValidationState('invalid')
        },
      }
    )
  }

  // ── Success screen ────────────────────────────────────────────────────────

  if (savedOrderId) {
    return (
      <div className="p-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
        <SuccessState
          title="Thank you for your order!"
          description="Your order is being processed. We'll notify you soon."
          actionLabel="Go to dashboard"
          onAction={() => navigate('/')}
        />
      </div>
    )
  }

  // ── Main form ─────────────────────────────────────────────────────────────

  const coordsValid = validationState === 'valid'
  const coordsInvalid = validationState === 'invalid'

  return (
    <div className="p-8">
      {/* Back link */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Order</h1>
        <p className="mt-0.5 text-sm text-gray-500">Enter location and order details to calculate tax</p>
      </div>

      <div className="grid grid-cols-2 gap-6 items-start">
        {/* ── Left column: order details form ─────────────────────────── */}
        <div className="flex flex-col gap-4">
          <SectionCard title="Order Details">
            <div className="flex flex-col gap-4">
              {/* Latitude */}
              <FormField
                label="Latitude"
                placeholder="40.7580"
                value={latStr}
                onChange={(e) => handleLatChange(e.target.value)}
                helperText="Click on the map or enter manually"
                error={coordsInvalid ? (validationError ?? undefined) : undefined}
                success={coordsValid}
                successText="Coordinates verified — New York State ✓"
              />

              {/* Longitude */}
              <FormField
                label="Longitude"
                placeholder="-73.9855"
                value={lonStr}
                onChange={(e) => handleLonChange(e.target.value)}
                helperText="Only New York state coordinates are accepted"
                success={coordsValid}
              />

              {/* Validation spinner */}
              {validationState === 'validating' && (
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
                  Verifying location via reverse geocoding…
                </p>
              )}

              {/* Subtotal */}
              <FormField
                label="Subtotal ($)"
                type="number"
                placeholder="100.00"
                value={subtotal}
                onChange={(e) => {
                  setSubtotal(e.target.value)
                  setTaxResult(null)
                }}
                helperText="Order subtotal before tax"
                min="0"
                step="0.01"
              />

              <PrimaryButton
                onClick={handleCalculateTax}
                disabled={validationState === 'validating'}
              >
                {validationState === 'validating' ? 'Validating…' : 'Calculate Tax'}
              </PrimaryButton>
            </div>
          </SectionCard>

          {/* Tax result card */}
          {taxResult && (
            <TaxSummaryCard
              subtotal={parseFloat(subtotal)}
              taxRate={taxResult.taxRate}
              taxAmount={taxResult.taxAmount}
              total={taxResult.total}
              action={
                <OutlineButton onClick={handleSaveOrder} disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Confirm & Save Order'
                  )}
                </OutlineButton>
              }
            />
          )}
        </div>

        {/* ── Right column: interactive map ────────────────────────────── */}
        <SectionCard
          title="Select Location"
          icon={<MapPin size={16} />}
          contentClassName="pt-2"
        >
          <MapPicker
            latitude={mapLat}
            longitude={mapLon}
            onLocationChange={handleLocationChange}
            height={360}
          />
        </SectionCard>
      </div>
    </div>
  )
}
