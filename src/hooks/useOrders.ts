import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders, getAllOrders, getOrder, getOrderStats, createOrder, importOrders } from '../lib/orders'
import type { BackendOrder } from '../lib/orders'

export const queryKeys = {
  orders: ['orders'] as const,
  allOrders: ['allOrders'] as const,
  ordersList: (page: number, size: number, sort?: string) => [...queryKeys.orders, 'list', { page, size, sort }] as const,
  orderDetail: (id: string) => [...queryKeys.orders, 'detail', id] as const,
  orderStats: ['orders', 'stats'] as const,
}

export function useOrdersQuery(page: number, size: number, sort?: string) {
  return useQuery({
    queryKey: queryKeys.ordersList(page, size, sort),
    queryFn: () => getOrders(page, size, sort),
    // Keep previous data when fetching a new page to avoid loading jump
    placeholderData: (previousData) => previousData,
  })
}

export function useAllOrdersQuery() {
  return useQuery({
    queryKey: queryKeys.allOrders,
    queryFn: () => getAllOrders(),
    // Keep stale time high since fetching all records is expensive,
    // mutations will invalidate it anyway.
    staleTime: 5 * 60 * 1000,
  })
}

export function useOrderQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.orderDetail(id),
    queryFn: () => getOrder(id),
    enabled: !!id,
  })
}

export function useOrderStatsQuery() {
  return useQuery({
    queryKey: queryKeys.orderStats,
    queryFn: getOrderStats,
  })
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderData: Partial<BackendOrder>) => createOrder(orderData),
    onSuccess: () => {
      // Invalidate both the list and the stats so dashboards update
      queryClient.invalidateQueries({ queryKey: queryKeys.orders })
      queryClient.invalidateQueries({ queryKey: queryKeys.allOrders })
    },
  })
}

export function useImportOrdersMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => importOrders(file),
    onSuccess: () => {
      // Invalidate to fetch new data after import
      queryClient.invalidateQueries({ queryKey: queryKeys.orders })
      queryClient.invalidateQueries({ queryKey: queryKeys.allOrders })
    },
  })
}
