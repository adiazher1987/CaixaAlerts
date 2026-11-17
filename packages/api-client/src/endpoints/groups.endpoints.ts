import type { AxiosInstance } from 'axios'
import type {
  Group,
  Guardia,
  GuardiaWithMembers,
  CreateGroupDto,
  UpdateGroupDto,
  CreateGuardiaDto,
  UpdateGuardiaDto,
  ApiResponse,
} from '@caixalertas/types'

export const createGroupEndpoints = (client: AxiosInstance) => ({
  list: () =>
    client.get<ApiResponse<Group[]>>('/groups').then((r) => r.data),

  getById: (id: string) =>
    client.get<ApiResponse<Group>>(`/groups/${id}`).then((r) => r.data),

  create: (dto: CreateGroupDto) =>
    client.post<ApiResponse<Group>>('/groups', dto).then((r) => r.data),

  update: (id: string, dto: UpdateGroupDto) =>
    client.patch<ApiResponse<Group>>(`/groups/${id}`, dto).then((r) => r.data),

  // Guardias
  getGuardias: (groupId: string) =>
    client
      .get<ApiResponse<GuardiaWithMembers[]>>(`/groups/${groupId}/guardias`)
      .then((r) => r.data),

  getActiveGuardia: (groupId: string) =>
    client
      .get<ApiResponse<GuardiaWithMembers>>(`/groups/${groupId}/guardias/active`)
      .then((r) => r.data),

  createGuardia: (dto: CreateGuardiaDto) =>
    client
      .post<ApiResponse<Guardia>>(`/groups/${dto.groupId}/guardias`, dto)
      .then((r) => r.data),

  updateGuardia: (groupId: string, guardiaId: string, dto: UpdateGuardiaDto) =>
    client
      .patch<ApiResponse<Guardia>>(`/groups/${groupId}/guardias/${guardiaId}`, dto)
      .then((r) => r.data),
})
