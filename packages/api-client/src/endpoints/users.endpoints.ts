import type { AxiosInstance } from 'axios'
import type { UserPublic, CreateUserDto, UpdateUserDto, ApiResponse } from '@caixalertas/types'

export const createUserEndpoints = (client: AxiosInstance) => ({
  list: (groupId?: string) =>
    client
      .get<ApiResponse<UserPublic[]>>('/users', { params: groupId ? { groupId } : undefined })
      .then((r) => r.data),

  getById: (id: string) =>
    client.get<ApiResponse<UserPublic>>(`/users/${id}`).then((r) => r.data),

  create: (dto: CreateUserDto) =>
    client.post<ApiResponse<UserPublic>>('/users', dto).then((r) => r.data),

  update: (id: string, dto: UpdateUserDto) =>
    client.patch<ApiResponse<UserPublic>>(`/users/${id}`, dto).then((r) => r.data),

  unlock: (id: string) =>
    client.post<ApiResponse<UserPublic>>(`/users/${id}/unlock`).then((r) => r.data),

  deactivate: (id: string) =>
    client.delete<ApiResponse>(`/users/${id}`).then((r) => r.data),
})
