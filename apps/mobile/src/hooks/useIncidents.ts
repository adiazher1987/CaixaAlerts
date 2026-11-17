import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient } from '@caixalertas/api-client'
import type {
  IncidentFilters,
  CreateIncidentDto,
  AcknowledgeIncidentDto,
  EscalateIncidentDto,
  ResolveIncidentDto,
} from '@caixalertas/types'

export const INCIDENT_KEYS = {
  all: ['incidents'] as const,
  list: (filters?: IncidentFilters) => [...INCIDENT_KEYS.all, 'list', filters] as const,
  detail: (id: string) => [...INCIDENT_KEYS.all, 'detail', id] as const,
}

export const useIncidents = (filters?: IncidentFilters) =>
  useQuery({
    queryKey: INCIDENT_KEYS.list(filters),
    queryFn: () => getApiClient().incidents.list(filters),
    select: (res) => res.data,
  })

export const useIncident = (id: string) =>
  useQuery({
    queryKey: INCIDENT_KEYS.detail(id),
    queryFn: () => getApiClient().incidents.getById(id),
    select: (res) => res.data,
    enabled: !!id,
  })

export const useCreateIncident = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateIncidentDto) => getApiClient().incidents.create(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INCIDENT_KEYS.all })
    },
  })
}

export const useAcknowledge = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: AcknowledgeIncidentDto) => getApiClient().incidents.acknowledge(dto),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: INCIDENT_KEYS.detail(variables.incidentId) })
      void queryClient.invalidateQueries({ queryKey: INCIDENT_KEYS.list() })
    },
  })
}

export const useEscalate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: EscalateIncidentDto) => getApiClient().incidents.escalate(dto),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: INCIDENT_KEYS.detail(variables.incidentId) })
      void queryClient.invalidateQueries({ queryKey: INCIDENT_KEYS.list() })
    },
  })
}

export const useResolve = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: ResolveIncidentDto) => getApiClient().incidents.resolve(dto),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: INCIDENT_KEYS.detail(variables.incidentId) })
      void queryClient.invalidateQueries({ queryKey: INCIDENT_KEYS.list() })
    },
  })
}
