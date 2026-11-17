import type { AxiosInstance } from 'axios'
import type { NodoEstructura, CreateNodoDto, UpdateNodoDto, ApiResponse } from '@caixalertas/types'

export const createEstructuraEndpoints = (client: AxiosInstance) => ({
  getTree: () =>
    client.get<ApiResponse<NodoEstructura[]>>('/estructura').then((r) => r.data),

  getById: (id: string) =>
    client.get<ApiResponse<NodoEstructura>>(`/estructura/${id}`).then((r) => r.data),

  create: (dto: CreateNodoDto) =>
    client.post<ApiResponse<NodoEstructura>>('/estructura', dto).then((r) => r.data),

  update: (id: string, dto: UpdateNodoDto) =>
    client.patch<ApiResponse<NodoEstructura>>(`/estructura/${id}`, dto).then((r) => r.data),

  delete: (id: string) =>
    client.delete<ApiResponse>(`/estructura/${id}`).then((r) => r.data),
})
