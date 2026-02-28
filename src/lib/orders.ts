import { fetchApi, API_BASE_URL } from './api'

export interface BackendTaxDetails {
  compositeTaxRate: number
  taxAmount: number
  totalAmount: number
  jurisdiction: {
    id: string
    name: string
    code: string
    breakdown: {
      stateRate: number
      countyRate: number
      cityRate: number
      specialRate: number
    }
  }
}

export interface BackendOrder {
  id?: string // Often missing in Spring Data REST unless explicitly exposed
  longitude: number
  latitude: number
  subtotal: number
  wellnessType: string | null
  timestamp: string
  taxDetails?: BackendTaxDetails
  _links?: {
    self: { href: string }
  }
}

export interface Order {
  id: string
  timestamp: string
  address: string
  latitude: number
  longitude: number
  subtotal: number
  wellnessType: string | null
  taxRate: number
  taxAmount: number
  total: number
  status: 'Completed' | 'Pending' | 'Cancelled'
  taxBreakdown: { jurisdiction: string, rate: number, amount: number }[]
}

export interface OrderStats {
  totalOrders: number
  totalRevenue: number
  totalTax: number
}

// Maps backend order to frontend order format to avoid changing too many UI components
export function mapBackendOrder(o: BackendOrder): Order {
  let id = o.id
  if (!id && o._links?.self?.href) {
    const parts = o._links.self.href.split('/')
    id = parts[parts.length - 1]
  }

  // Map the exact breakdown array from backend
  const breakdown = []
  if (o.taxDetails?.jurisdiction?.breakdown) {
    const bd = o.taxDetails.jurisdiction.breakdown
    if (bd.stateRate > 0) breakdown.push({ jurisdiction: 'State', rate: bd.stateRate, amount: parseFloat((o.subtotal * bd.stateRate).toFixed(2)) })
    if (bd.countyRate > 0) breakdown.push({ jurisdiction: 'County', rate: bd.countyRate, amount: parseFloat((o.subtotal * bd.countyRate).toFixed(2)) })
    if (bd.cityRate > 0) breakdown.push({ jurisdiction: 'City', rate: bd.cityRate, amount: parseFloat((o.subtotal * bd.cityRate).toFixed(2)) })
    if (bd.specialRate > 0) breakdown.push({ jurisdiction: 'Special', rate: bd.specialRate, amount: parseFloat((o.subtotal * bd.specialRate).toFixed(2)) })
  }

  return {
    id: id || 'Unknown',
    timestamp: o.timestamp,
    address: o.taxDetails?.jurisdiction?.name || 'Unknown Location', // fallback since backend doesn't store full address
    latitude: o.latitude,
    longitude: o.longitude,
    subtotal: o.subtotal,
    wellnessType: o.wellnessType,
    taxRate: o.taxDetails?.compositeTaxRate || 0,
    taxAmount: o.taxDetails?.taxAmount || 0,
    total: o.taxDetails?.totalAmount || o.subtotal,
    status: 'Completed', // Mock status as backend doesn't have order status yet
    taxBreakdown: breakdown,
  }
}

export async function getOrders(page: number = 0, size: number = 20, sort?: string) {
  const url = new URL('/orders', window.location.origin)
  url.searchParams.set('page', page.toString())
  url.searchParams.set('size', size.toString())
  if (sort) url.searchParams.set('sort', sort)

  const res = await fetchApi(url.pathname + url.search)
  if (!res.ok) throw new Error('Failed to fetch orders')

  const data = await res.json()
  const backendOrders: BackendOrder[] = data._embedded?.orders || []

  return {
    orders: backendOrders.map(mapBackendOrder),
    pageInfo: data.page,
  }
}

// Get all orders concurrently for client-side filtering
export async function getAllOrders(): Promise<Order[]> {
  // 1. Fetch first page to get totalPages
  const size = 1000
  const url = new URL('/orders', window.location.origin)
  url.searchParams.set('page', '0')
  url.searchParams.set('size', size.toString())

  const res = await fetchApi(url.pathname + url.search)
  if (!res.ok) throw new Error('Failed to fetch orders')
  const data = await res.json()

  const backendOrders: BackendOrder[] = data._embedded?.orders || []
  const allOrders = backendOrders.map(mapBackendOrder)

  const totalPages = data.page?.totalPages || 1

  // 2. Fetch remaining pages concurrently
  if (totalPages > 1) {
    const promises = []
    for (let p = 1; p < totalPages; p++) {
      const pageUrl = new URL('/orders', window.location.origin)
      pageUrl.searchParams.set('page', p.toString())
      pageUrl.searchParams.set('size', size.toString())

      const promise = fetchApi(pageUrl.pathname + pageUrl.search)
        .then(r => r.json())
        .then(d => {
          const pageBackendOrders: BackendOrder[] = d._embedded?.orders || []
          return pageBackendOrders.map(mapBackendOrder)
        })
      promises.push(promise)
    }

    const results = await Promise.all(promises)
    for (const pageItems of results) {
      allOrders.push(...pageItems)
    }
  }

  // Fallback map sorting on client instead
  allOrders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return allOrders
}

export async function getOrder(id: string) {
  const res = await fetchApi(`/orders/${id}`)
  if (!res.ok) throw new Error('Failed to fetch order: ' + id)

  const data: BackendOrder = await res.json()
  return mapBackendOrder(data)
}

export async function getOrderStats(): Promise<OrderStats> {
  const res = await fetchApi('/orders/stats')
  // Depending on whether Spring Data REST correctly configures the non-CRUD endpoint
  // if not accessible, might need to catch and return 0s
  if (!res.ok) throw new Error('Failed to fetch stats')
  return await res.json()
}

export async function createOrder(orderData: Partial<BackendOrder>) {
  const res = await fetchApi('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error('Failed to create order: ' + errorText)
  }
  return await res.json()
}

export async function importOrders(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  // fetchApi sets 'application/json' if body is present and no Content-Type is provided, 
  // but for FormData we should let the browser set the Content-Type with the boundary.
  const token = localStorage.getItem('auth_token')
  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const url = `${API_BASE_URL}/orders/import`

  const res = await fetch(url, {
    method: 'POST',
    headers, // Omit Content-Type so browser sets multipart boundary
    body: formData,
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || 'Failed to import orders')
  }

  return await res.json()
}
