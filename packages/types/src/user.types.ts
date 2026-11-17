// ─── Roles ────────────────────────────────────────────────────────────────────
export type UserRole =
  | 'superadmin'           // Administra toda la plataforma
  | 'responsable_cliente'  // Responsable del cliente (visibilidad global)
  | 'responsable_grupo'    // Responsable de un grupo de guardias
  | 'responsable_guardia'  // Responsable de turno de guardia
  | 'miembro_guardia'      // Miembro del equipo de guardia
  | 'readonly'             // Solo consulta

export const ROLE_ESCALATION_LEVEL: Record<UserRole, number> = {
  superadmin: 5,
  responsable_cliente: 4,
  responsable_grupo: 3,
  responsable_guardia: 2,
  miembro_guardia: 1,
  readonly: 0,
}

// ─── Usuario ─────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: UserRole
  groupId?: string           // Grupo al que pertenece (G8, G9, G10...)
  fcmTokens: string[]        // Tokens FCM para push notifications
  biometricEnabled: boolean
  isActive: boolean
  lastLoginAt?: string       // ISO date
  createdAt: string
  updatedAt: string
}

export interface UserPublic extends Omit<User, 'fcmTokens'> {
  isLocked?: boolean
}

export interface CreateUserDto {
  email: string
  password: string
  name: string
  phone?: string
  role: UserRole
  groupId?: string
}

export interface UpdateUserDto {
  name?: string
  phone?: string
  role?: UserRole
  groupId?: string
  isActive?: boolean
  password?: string
}
