import type { IncidentSeverity, EscalationLevel } from './incident.types'

// ─── Tipos de notificación ───────────────────────────────────────────────────
export type NotificationType =
  | 'incident_created'
  | 'incident_acknowledged'
  | 'incident_escalated'
  | 'incident_cross_group'
  | 'incident_resolved'
  | 'incident_closed'
  | 'incident_sla_warning'    // 80% del SLA consumido
  | 'incident_sla_breached'
  | 'auto_escalation_warning' // Aviso antes del auto-escalado
  | 'guardia_starting'        // Tu guardia empieza en X horas
  | 'system'

// ─── Notificación en el centro de notificaciones ─────────────────────────────
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  data?: NotificationData
  isRead: boolean
  readAt?: string
  createdAt: string
}

// Datos estructurados para deep linking
export interface NotificationData {
  incidentId?: string
  groupId?: string
  severity?: IncidentSeverity
  escalationLevel?: EscalationLevel
  deepLink?: string           // e.g. 'caixalertas://incidents/abc123'
  actionUrl?: string
}

export interface MarkReadDto {
  notificationIds: string[]
}

export interface NotificationFilters {
  isRead?: boolean
  type?: NotificationType
  page?: number
  limit?: number
}

// ─── Payload para Firebase Cloud Messaging ───────────────────────────────────
export interface FcmPayload {
  token: string | string[]
  title: string
  body: string
  data?: Record<string, string>   // FCM solo acepta strings
  imageUrl?: string
  sound?: string
  badge?: number
  priority?: 'normal' | 'high'
  collapseKey?: string            // Agrupa notificaciones del mismo incidente
  ttl?: number                    // Segundos antes de expirar
}
