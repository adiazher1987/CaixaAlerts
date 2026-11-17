import type { IncidentSeverity, EscalationLevel } from './incident.types'

// ─── Filtros de reporte ───────────────────────────────────────────────────────
export interface ReportFilters {
  dateFrom: string
  dateTo: string
  groupId?: string
  severity?: IncidentSeverity[]
}

// ─── Reporte de incidencias ───────────────────────────────────────────────────
export interface IncidentReport {
  period: { from: string; to: string }
  summary: {
    total: number
    byStatus: Record<string, number>
    bySeverity: Record<IncidentSeverity, number>
    slaBreached: number
    slaBreachedPercentage: number
    avgResolutionTimeMinutes: number
    mttrByPriority: Record<IncidentSeverity, number>  // Mean Time To Resolve
    mttaByPriority: Record<IncidentSeverity, number>  // Mean Time To Acknowledge
  }
  byGroup: GroupReport[]
  byApplication: ApplicationReport[]
  escalationStats: EscalationStats
  timeDistribution: TimeDistribution[]
  trend: TrendPoint[]
}

export interface GroupReport {
  groupId: string
  groupCode: string
  groupName: string
  total: number
  bySeverity: Record<IncidentSeverity, number>
  receivedCrossGroup: number    // Incidencias recibidas de otros grupos
  sentCrossGroup: number        // Incidencias derivadas a otros grupos
  avgResolutionTimeMinutes: number
  slaBreached: number
}

export interface ApplicationReport {
  application: string
  total: number
  bySeverity: Record<IncidentSeverity, number>
  topGroups: string[]
}

export interface EscalationStats {
  totalEscalations: number
  byLevel: Record<EscalationLevel, number>
  autoEscalations: number
  manualEscalations: number
  crossGroupEscalations: number
  avgEscalationsPerIncident: number
}

export interface TimeDistribution {
  hour: number        // 0-23
  count: number
  isNocturnal: boolean  // true si 22:00-06:00
}

export interface TrendPoint {
  date: string        // ISO date (día)
  total: number
  bySeverity: Record<IncidentSeverity, number>
}

// ─── Export ───────────────────────────────────────────────────────────────────
export type ReportFormat = 'json' | 'pdf' | 'xlsx'
