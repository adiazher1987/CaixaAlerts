import type { UserPublic } from './user.types'
import type { Group } from './group.types'

// ─── Severidad ───────────────────────────────────────────────────────────────
export type IncidentSeverity = 'P1' | 'P2' | 'P3' | 'P4'

export const SEVERITY_LABEL: Record<IncidentSeverity, string> = {
  P1: 'Crítico',
  P2: 'Alto',
  P3: 'Medio',
  P4: 'Bajo',
}

// SLA en minutos por severidad
export const SEVERITY_SLA_MINUTES: Record<IncidentSeverity, number> = {
  P1: 240, // 4h
  P2: 480, // 8h
  P3: 1440, // 24h
  P4: 4320, // 72h
}

// Tiempo máximo de espera por nivel antes de auto-escalar (minutos)
export const SEVERITY_ESCALATION_TIMEOUT: Record<IncidentSeverity, number> = {
  P1: 10,
  P2: 30,
  P3: 60,
  P4: 120,
}

// ─── Estado ──────────────────────────────────────────────────────────────────
export type IncidentStatus =
  | 'open' // Recién creada, sin ACK
  | 'acknowledged' // Alguien ha confirmado recepción
  | 'in_progress' // Se está trabajando en ella
  | 'escalated' // Escalada a otro nivel o grupo
  | 'resolved' // Resuelta por el equipo técnico
  | 'closed' // Cerrada formalmente con post-mortem

// ─── Niveles de escalado ─────────────────────────────────────────────────────
export type EscalationLevel = 1 | 2 | 3 | 4 | 5 | 6

export const ESCALATION_LEVEL_LABEL: Record<EscalationLevel, string> = {
  1: 'Guardia activa',
  2: 'Responsable de guardia',
  3: 'Responsable de grupo',
  4: 'Responsable de cliente',
  5: 'Responsable de cuenta',
  6: 'CEO / Dirección',
}

// ─── Evento del timeline ─────────────────────────────────────────────────────
export type TimelineEventType =
  | 'created'
  | 'acknowledged'
  | 'escalated'
  | 'cross_group' // Derivada a otro grupo
  | 'status_changed'
  | 'comment'
  | 'resolved'
  | 'closed'
  | 'auto_escalated' // Escalado automático por timeout

export interface TimelineEvent {
  id: string
  incidentId: string
  type: TimelineEventType
  userId: string
  userName: string
  message: string
  metadata?: Record<string, unknown>
  createdAt: string
}

// ─── Incidencia ──────────────────────────────────────────────────────────────
export interface Incident {
  id: string
  title: string
  description: string
  application?: string // Aplicación o sistema afectado
  severity: IncidentSeverity
  status: IncidentStatus
  currentEscalationLevel: EscalationLevel
  originGroupId: string // Grupo que recibió la llamada inicial
  involvedGroupIds: string[] // Grupos involucrados (cross-group)
  createdById: string
  acknowledgedById?: string
  acknowledgedAt?: string
  resolvedById?: string
  resolvedAt?: string
  resolutionSummary?: string
  closedAt?: string
  slaDeadline: string // ISO date calculado al crear
  slaBreached: boolean
  externalCallerId?: string // Número/nombre de quien llamó
  externalCallerPhone?: string
  timeline: TimelineEvent[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface IncidentWithRelations extends Incident {
  originGroup: Group
  involvedGroups: Group[]
  createdBy: UserPublic
  acknowledgedBy?: UserPublic
  resolvedBy?: UserPublic
}

// ─── DTOs ────────────────────────────────────────────────────────────────────
export interface CreateIncidentDto {
  title: string
  description: string
  application: string
  severity: IncidentSeverity
  originGroupId: string
  externalCallerId?: string
  externalCallerPhone?: string
}

export interface AcknowledgeIncidentDto {
  incidentId: string
  message?: string
}

export interface EscalateIncidentDto {
  incidentId: string
  targetLevel: EscalationLevel
  reason: string
  targetGroupId?: string // Para escalado cross-group
}

export interface ResolveIncidentDto {
  incidentId: string
  resolutionSummary: string
  rootCause?: string
  preventiveActions?: string
}

export interface AddCommentDto {
  incidentId: string
  message: string
}

// ─── Filtros para listados ────────────────────────────────────────────────────
export interface IncidentFilters {
  status?: IncidentStatus | IncidentStatus[]
  severity?: IncidentSeverity | IncidentSeverity[]
  groupId?: string
  dateFrom?: string
  dateTo?: string
  slaBreached?: boolean
  search?: string
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}
