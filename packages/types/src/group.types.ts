// ─── Grupos (G8-Arquitectura, G9-Data, G10-Aplicaciones...) ──────────────────
export interface Group {
  id: string
  code: string              // 'G8', 'G9', 'G10'
  name: string              // 'Arquitectura', 'Data', 'Aplicaciones'
  description?: string
  responsableId?: string    // Usuario responsable del grupo
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateGroupDto {
  code: string
  name: string
  description?: string
  responsableId?: string
}

export interface UpdateGroupDto {
  name?: string
  description?: string
  responsableId?: string
  isActive?: boolean
}

// ─── Guardias (turnos 24x7) ──────────────────────────────────────────────────
export type GuardiaStatus = 'active' | 'scheduled' | 'completed' | 'cancelled'

export interface Guardia {
  id: string
  groupId: string
  name: string              // 'Guardia G10 - Semana 13'
  memberIds: string[]       // IDs de usuarios en guardia
  responsableId?: string    // Responsable de la guardia
  startAt: string           // ISO date
  endAt: string             // ISO date
  status: GuardiaStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface GuardiaWithMembers extends Guardia {
  members: import('./user.types').UserPublic[]
  group: Group
}

export interface CreateGuardiaDto {
  groupId: string
  name: string
  memberIds: string[]
  responsableId?: string
  startAt: string
  endAt: string
  notes?: string
}

export interface UpdateGuardiaDto {
  name?: string
  memberIds?: string[]
  responsableId?: string
  startAt?: string
  endAt?: string
  notes?: string
  status?: GuardiaStatus
}
