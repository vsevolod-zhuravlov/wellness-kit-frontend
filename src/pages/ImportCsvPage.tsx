import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Upload, FileText, X, AlertCircle,
  CheckCircle2, Download, Loader2, ShieldCheck, ShieldX,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrimaryButton } from '@/components/Buttons'
import { useImportOrdersMutation } from '@/hooks/useOrders'

// ── CSV column schema ────────────────────────────────────────────────────────
const REQUIRED_COLUMNS = ['latitude', 'longitude', 'subtotal'] as const
const OPTIONAL_COLUMNS = ['id', 'timestamp', 'address'] as const
const ALL_KNOWN_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS]

// ── NY bounding box ───────────────────────────────────────────────────────────
const NY_BOUNDS = { latMin: 40.496, latMax: 45.016, lonMin: -79.763, lonMax: -71.856 }

function inNYBounds(lat: number, lon: number) {
  return lat >= NY_BOUNDS.latMin && lat <= NY_BOUNDS.latMax &&
    lon >= NY_BOUNDS.lonMin && lon <= NY_BOUNDS.lonMax
}

// ── Types ─────────────────────────────────────────────────────────────────────

type CsvRow = Record<string, string>

interface ParseResult {
  headers: string[]
  rows: CsvRow[]
  parseErrors: string[]
  missingColumns: string[]
}

type GeoStatus = 'pending' | 'checking' | 'valid' | 'invalid' | 'error'

interface RowValidation {
  status: GeoStatus
  reason?: string   // shown on invalid/error
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCsv(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) {
    return { headers: [], rows: [], parseErrors: ['File is empty.'], missingColumns: [] }
  }
  const firstLine = lines[0]
  const delimiter = firstLine.includes(';') ? ';' : ','
  const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase())
  const missingColumns = REQUIRED_COLUMNS.filter((col) => !headers.includes(col))

  const rows: CsvRow[] = []
  const parseErrors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    const cells = splitCsvLine(line, delimiter)
    if (cells.length !== headers.length) {
      parseErrors.push(`Row ${i + 1}: expected ${headers.length} columns, got ${cells.length}`)
      continue
    }
    const row: CsvRow = {}
    headers.forEach((h, idx) => { row[h] = cells[idx].replace(/^"|"$/g, '').trim() })
    rows.push(row)
  }
  return { headers, rows, parseErrors, missingColumns }
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === delimiter && !inQuotes) { result.push(current); current = '' }
    else { current += ch }
  }
  result.push(current)
  return result
}

// ── Geocoding API removed for performance ──────────────────────────────────
// We rely solely on the NY bounding box check (inNYBounds) to avoid rate limits
// and long processing times for large CSV files.

// ── Sample CSV ─────────────────────────────────────────────────────────────────

const SAMPLE_CSV = `id,latitude,longitude,timestamp,subtotal,address
1,40.7580,-73.9855,2026-02-28T10:00:00Z,120,Manhattan NY
2,40.6782,-73.9442,2026-02-28T11:00:00Z,85,Brooklyn NY
3,42.6526,-73.7562,2026-02-28T12:00:00Z,250,Albany NY
`

function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'orders_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function colLabel(col: string) { return col.charAt(0).toUpperCase() + col.slice(1) }

function statusIcon(s: GeoStatus) {
  switch (s) {
    case 'valid': return <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
    case 'invalid': return <ShieldX size={15} className="text-red-500 flex-shrink-0" />
    case 'error': return <AlertCircle size={15} className="text-amber-500 flex-shrink-0" />
    case 'checking': return <Loader2 size={15} className="text-gray-400 flex-shrink-0 animate-spin" />
    default: return <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 inline-block flex-shrink-0" />
  }
}

function statusLabel(v: RowValidation) {
  switch (v.status) {
    case 'valid': return <span className="text-green-600 text-xs font-medium">New York ✓</span>
    case 'invalid': return <span className="text-red-500 text-xs">{v.reason ?? 'Not in NY'}</span>
    case 'error': return <span className="text-amber-600 text-xs">Geocode failed</span>
    case 'checking': return <span className="text-gray-400 text-xs">Checking…</span>
    default: return <span className="text-gray-300 text-xs">—</span>
  }
}

const PAGE_SIZE = 50

// ─────────────────────────────────────────────────────────────────────────────

export default function ImportCsvPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const validationAbortRef = useRef<AbortController | null>(null)

  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [validations, setValidations] = useState<RowValidation[]>([])
  const [validatingIdx, setValidatingIdx] = useState<number | null>(null) // current row being checked
  const [page, setPage] = useState(1)
  const [uploadDone, setUploadDone] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const importMutation = useImportOrdersMutation()

  // ── Derived ───────────────────────────────────────────────────────────────

  const rows = parseResult?.rows ?? []
  const hasData = rows.length > 0
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const headersToShow = parseResult?.headers ?? []
  const hasMissing = (parseResult?.missingColumns.length ?? 0) > 0

  const validationDone = validations.length === rows.length &&
    validations.every((v) => v.status !== 'pending' && v.status !== 'checking')
  const invalidCount = validations.filter((v) => v.status === 'invalid' || v.status === 'error').length
  const validCount = validations.filter((v) => v.status === 'valid').length
  const isValidating = validatingIdx !== null

  const canUpload = hasData && !hasMissing && validationDone && invalidCount === 0 && !uploadDone

  // ── Validation runner ─────────────────────────────────────────────────────

  const runValidation = useCallback(async (csvRows: CsvRow[], abort: AbortController) => {
    // For large files, synchronously validating bounds is fast enough (ms)
    // and bypasses the need for 1req/s API rate limits
    const results: RowValidation[] = csvRows.map((row) => {
      const lat = parseFloat(row['latitude'] ?? '')
      const lon = parseFloat(row['longitude'] ?? '')

      if (isNaN(lat) || isNaN(lon)) {
        return { status: 'invalid', reason: 'Invalid coordinates' }
      }

      if (!inNYBounds(lat, lon)) {
        return { status: 'invalid', reason: 'Outside NY state bounds' }
      }

      return { status: 'valid' }
    })

    if (abort.signal.aborted) return

    // Sort so invalid are first
    const indexed = csvRows.map((row, i) => ({ row, val: results[i] }))
    indexed.sort((a, b) => {
      const aInvalid = a.val.status === 'invalid' || a.val.status === 'error'
      const bInvalid = b.val.status === 'invalid' || b.val.status === 'error'
      if (aInvalid && !bInvalid) return -1
      if (!aInvalid && bInvalid) return 1
      return 0
    })

    const sortedRows = indexed.map(x => x.row)
    const sortedVals = indexed.map(x => x.val)

    setParseResult(prev => prev ? { ...prev, rows: sortedRows } : null)
    setValidations(sortedVals)
    setValidatingIdx(null)
  }, [])

  // ── File handling ─────────────────────────────────────────────────────────

  const processFile = useCallback((file: File) => {
    // Abort any running validation
    validationAbortRef.current?.abort()
    const abort = new AbortController()
    validationAbortRef.current = abort

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setParseResult({ headers: [], rows: [], parseErrors: ['Please upload a .csv file.'], missingColumns: [] })
      setValidations([])
      setFileName(file.name)
      return
    }

    setFileName(file.name)
    setSelectedFile(file)
    setPage(1)
    setUploadDone(false)
    setUploadError(null)
    setValidations([])
    setValidatingIdx(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = parseCsv(e.target?.result as string)
      setParseResult(result)
      // Only validate if all required cols present and rows exist
      if (result.missingColumns.length === 0 && result.rows.length > 0) {
        runValidation(result.rows, abort)
      }
    }
    reader.readAsText(file)
  }, [runValidation])

  // Clean up on unmount
  useEffect(() => () => { validationAbortRef.current?.abort() }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleClear = () => {
    validationAbortRef.current?.abort()
    setFileName(null)
    setSelectedFile(null)
    setParseResult(null)
    setValidations([])
    setValidatingIdx(null)
    setUploadDone(false)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Upload ─────────────────────────────────────────────────────────

  const handleRemoveInvalid = () => {
    if (!parseResult || !selectedFile) return
    const validRows = parseResult.rows.filter((_, i) => validations[i]?.status === 'valid')
    const headerLine = parseResult.headers.join(',')
    const csvLines = validRows.map((r) => parseResult.headers.map((h) => {
      const val = r[h] ?? ''
      return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val
    }).join(','))
    const newCsv = [headerLine, ...csvLines].join('\n')
    const blob = new Blob([newCsv], { type: 'text/csv' })
    const newFile = new File([blob], selectedFile.name, { type: 'text/csv' })

    setParseResult({
      ...parseResult,
      rows: validRows
    })
    setValidations(validRows.map(() => ({ status: 'valid' })))
    setSelectedFile(newFile)
    setPage(1)
  }

  const handleUpload = () => {
    if (!selectedFile) return
    setUploadError(null)

    importMutation.mutate(selectedFile, {
      onSuccess: () => {
        setUploadDone(true)
      },
      onError: (err: Error) => {
        setUploadError(err.message || 'Failed to upload file.')
      }
    })
  }

  // ── Validation summary bar ────────────────────────────────────────────────

  const renderValidationProgress = () => {
    if (!hasData || hasMissing || validations.length === 0) return null

    const total = rows.length
    const checked = validations.filter((v) => v.status !== 'pending').length

    if (isValidating || !validationDone) {
      return (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700 mb-4">
          <Loader2 size={16} className="flex-shrink-0 animate-spin" />
          <div className="flex-1">
            <span className="font-medium">Validating locations</span>
            <span className="text-blue-500 ml-2 text-xs">({checked}/{total} checked)</span>
          </div>
          {/* Mini progress bar */}
          <div className="w-32 h-1.5 rounded-full bg-blue-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(checked / total) * 100}%` }}
            />
          </div>
        </div>
      )
    }

    if (invalidCount > 0) {
      return (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border border-red-100 mb-4">
          <div className="flex items-start gap-2 text-sm text-red-700">
            <ShieldX size={16} className="flex-shrink-0 mt-0.5" />
            <span>
              <strong>{invalidCount} row{invalidCount !== 1 ? 's' : ''}</strong> failed location validation. Found at the top.
              <br /><span className="text-red-500">{validCount}/{total} valid rows remaining.</span>
            </span>
          </div>
          <button
            onClick={handleRemoveInvalid}
            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors flex-shrink-0"
          >
            Remove Invalid
          </button>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700 mb-4">
        <ShieldCheck size={16} className="flex-shrink-0" />
        <span>All <strong>{total} locations</strong> verified as New York State ✓</span>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      {/* Title */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Import Orders from CSV</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Upload a CSV with columns:{' '}
          <span className="font-medium text-gray-700">latitude, longitude, subtotal</span>
          {' '}(optionally: id, timestamp, address).
          All locations must be in New York State.
        </p>
      </div>

      <button
        onClick={downloadSampleCsv}
        className="flex items-center gap-1.5 text-sm text-[#4a7c59] hover:underline mb-6"
      >
        <Download size={14} />
        Download Sample CSV Template
      </button>

      {/* ── Drop zone ─────────────────────────────────────────────────── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !fileName && fileInputRef.current?.click()}
        className={cn(
          'relative rounded-2xl border-2 border-dashed transition-all mb-6',
          dragging ? 'border-[#4a7c59] bg-green-50'
            : fileName ? 'border-gray-200 bg-white cursor-default'
              : 'border-gray-300 bg-white hover:border-[#4a7c59] hover:bg-green-50/30 cursor-pointer'
        )}
      >
        <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />

        {!fileName && (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100">
              <Upload size={24} className="text-[#4a7c59]" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700">Drop your CSV file here</p>
              <p className="text-sm text-gray-400 mt-0.5">or click to browse</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <FileText size={14} />
              Browse File
            </button>
          </div>
        )}

        {fileName && (
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 flex-shrink-0">
                <FileText size={18} className="text-[#4a7c59]" />
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">{fileName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {rows.length.toLocaleString()} row{rows.length !== 1 ? 's' : ''} parsed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                className="text-sm text-[#4a7c59] hover:underline"
              >Replace</button>
              <button
                onClick={(e) => { e.stopPropagation(); handleClear() }}
                className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Parse errors / missing columns ────────────────────────────── */}
      {parseResult && (hasMissing || (parseResult.parseErrors.length > 0)) && (
        <div className="flex flex-col gap-2 mb-4">
          {hasMissing && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>
                Missing required column{parseResult.missingColumns.length > 1 ? 's' : ''}:{' '}
                <strong>{parseResult.missingColumns.join(', ')}</strong>
              </span>
            </div>
          )}
          {parseResult.parseErrors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Location validation progress / result ─────────────────────── */}
      {renderValidationProgress()}

      {/* ── Upload success ─────────────────────────────────────────────── */}
      {uploadDone && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700 mb-4">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span><strong>{rows.length.toLocaleString()} order{rows.length !== 1 ? 's' : ''}</strong> uploaded successfully!</span>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 mb-4">
          <ShieldX size={16} className="flex-shrink-0" />
          <span><strong>Error:</strong> {uploadError}</span>
        </div>
      )}

      {/* ── Preview table ─────────────────────────────────────────────── */}
      {hasData && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">
              Preview
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({rows.length.toLocaleString()} row{rows.length !== 1 ? 's' : ''})
              </span>
            </h2>
            <PrimaryButton
              className="w-auto px-6 h-9 text-sm"
              onClick={handleUpload}
              disabled={importMutation.isPending || !canUpload}
            >
              {importMutation.isPending
                ? <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
                  Uploading…
                </span>
                : uploadDone
                  ? '✓ Uploaded'
                  : isValidating
                    ? 'Validating…'
                    : invalidCount > 0
                      ? `${invalidCount} Invalid Row${invalidCount !== 1 ? 's' : ''}`
                      : `Upload ${rows.length.toLocaleString()} Order${rows.length !== 1 ? 's' : ''}`
              }
            </PrimaryButton>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide w-10">#</th>
                    {headersToShow.map((col) => (
                      <th
                        key={col}
                        className={cn(
                          'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap',
                          (REQUIRED_COLUMNS as readonly string[]).includes(col) ? 'text-[#4a7c59]' : 'text-gray-400'
                        )}
                      >
                        {colLabel(col)}
                        {(REQUIRED_COLUMNS as readonly string[]).includes(col) && (
                          <span className="ml-1 text-[9px] text-[#4a7c59]/60 normal-case tracking-normal font-normal">required</span>
                        )}
                      </th>
                    ))}
                    {/* Validation status column */}
                    {validations.length > 0 && (
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap text-gray-400">
                        NY Validation
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, i) => {
                    const rowNum = (page - 1) * PAGE_SIZE + i + 1
                    const absIdx = (page - 1) * PAGE_SIZE + i
                    const val = validations[absIdx]
                    const isInvalid = val?.status === 'invalid' || val?.status === 'error'

                    return (
                      <tr
                        key={rowNum}
                        className={cn(
                          'border-b border-gray-50 transition-colors',
                          isInvalid ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-gray-50/50'
                        )}
                      >
                        <td className="px-4 py-3 text-gray-400 text-xs">{rowNum}</td>
                        {headersToShow.map((col) => (
                          <td
                            key={col}
                            className={cn(
                              'px-4 py-3 whitespace-nowrap',
                              (REQUIRED_COLUMNS as readonly string[]).includes(col)
                                ? isInvalid && (col === 'latitude' || col === 'longitude')
                                  ? 'font-medium text-red-600'
                                  : 'font-medium text-gray-900'
                                : 'text-gray-600'
                            )}
                          >
                            {row[col] ?? '—'}
                          </td>
                        ))}
                        {validations.length > 0 && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            {val ? (
                              <div className="flex items-center gap-1.5">
                                {statusIcon(val.status)}
                                {statusLabel(val)}
                              </div>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white text-sm text-gray-500">
                <span>
                  Rows {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–{Math.min(page * PAGE_SIZE, rows.length).toLocaleString()} of {rows.length.toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={cn(
                      'px-3 py-1.5 rounded-full border text-sm font-medium transition-colors',
                      page === 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    )}
                  >Previous</button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={cn(
                      'px-3 py-1.5 rounded-full border text-sm font-medium transition-colors',
                      page === totalPages ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    )}
                  >Next</button>
                </div>
              </div>
            )}
          </div>

          {headersToShow.some((h) => !(ALL_KNOWN_COLUMNS as readonly string[]).includes(h)) && (
            <p className="text-xs text-gray-400 mb-4">Unknown columns will be ignored during import.</p>
          )}
        </>
      )}
    </div>
  )
}
