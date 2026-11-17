import type { AxiosInstance } from 'axios'
import type {
  Notification,
  MarkReadDto,
  NotificationFilters,
  PaginatedResult,
  ApiResponse,
} from '@caixalertas/types'

export const createNotificationEndpoints = (client: AxiosInstance) => ({
  list: (filters?: NotificationFilters) =>
    client
      .get<ApiResponse<PaginatedResult<Notification>>>('/notifications', { params: filters })
      .then((r) => r.data),

  markRead: (dto: MarkReadDto) =>
    client
      .post<ApiResponse>('/notifications/mark-read', dto)
      .then((r) => r.data),

  markAllRead: () =>
    client
      .post<ApiResponse>('/notifications/mark-all-read')
      .then((r) => r.data),

  getUnreadCount: () =>
    client
      .get<ApiResponse<{ count: number }>>('/notifications/unread-count')
      .then((r) => r.data),

  registerFcmToken: (token: string, platform: 'ios' | 'android' | 'web') =>
    client
      .post<ApiResponse>('/notifications/fcm-token', { token, platform })
      .then((r) => r.data),

  removeFcmToken: (token: string) =>
    client
      .delete<ApiResponse>('/notifications/fcm-token', { data: { token } })
      .then((r) => r.data),
})
