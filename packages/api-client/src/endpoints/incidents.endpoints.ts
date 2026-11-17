import type { AxiosInstance } from 'axios'
import type {
  Incident,
  IncidentWithRelations,
  CreateIncidentDto,
  AcknowledgeIncidentDto,
  EscalateIncidentDto,
  ResolveIncidentDto,
  AddCommentDto,
  IncidentFilters,
  PaginatedResult,
  ApiResponse,
} from '@caixalertas/types'

export const createIncidentEndpoints = (client: AxiosInstance) => ({
  list: (filters?: IncidentFilters) =>
    client
      .get<ApiResponse<PaginatedResult<Incident>>>('/incidents', { params: filters })
      .then((r) => r.data),

  getById: (id: string) =>
    client
      .get<ApiResponse<IncidentWithRelations>>(`/incidents/${id}`)
      .then((r) => r.data),

  create: (dto: CreateIncidentDto) =>
    client
      .post<ApiResponse<Incident>>('/incidents', dto)
      .then((r) => r.data),

  acknowledge: (dto: AcknowledgeIncidentDto) =>
    client
      .post<ApiResponse<Incident>>(`/incidents/${dto.incidentId}/acknowledge`, dto)
      .then((r) => r.data),

  escalate: (dto: EscalateIncidentDto) =>
    client
      .post<ApiResponse<Incident>>(`/incidents/${dto.incidentId}/escalate`, dto)
      .then((r) => r.data),

  resolve: (dto: ResolveIncidentDto) =>
    client
      .post<ApiResponse<Incident>>(`/incidents/${dto.incidentId}/resolve`, dto)
      .then((r) => r.data),

  close: (id: string) =>
    client
      .post<ApiResponse<Incident>>(`/incidents/${id}/close`)
      .then((r) => r.data),

  addComment: (dto: AddCommentDto) =>
    client
      .post<ApiResponse<Incident>>(`/incidents/${dto.incidentId}/comments`, dto)
      .then((r) => r.data),
})
