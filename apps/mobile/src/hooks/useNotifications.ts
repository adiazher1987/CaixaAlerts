import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient } from '@caixalertas/api-client'
import type { NotificationFilters } from '@caixalertas/types'

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: (filters?: NotificationFilters) => [...NOTIFICATION_KEYS.all, 'list', filters] as const,
  unreadCount: () => [...NOTIFICATION_KEYS.all, 'unread-count'] as const,
}

export const useNotifications = (filters?: NotificationFilters) =>
  useQuery({
    queryKey: NOTIFICATION_KEYS.list(filters),
    queryFn: () => getApiClient().notifications.list(filters),
    select: (res) => res.data,
  })

export const useUnreadCount = () =>
  useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: () => getApiClient().notifications.getUnreadCount(),
    select: (res) => res.data?.count ?? 0,
    refetchInterval: 30_000,  // Refresca cada 30 segundos
  })

export const useMarkRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => getApiClient().notifications.markRead({ notificationIds: ids }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    },
  })
}

export const useMarkAllRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => getApiClient().notifications.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    },
  })
}
