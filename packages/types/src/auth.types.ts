import type { UserPublic, UserRole } from './user.types'

// ─── Login ───────────────────────────────────────────────────────────────────
export interface LoginDto {
  email: string
  password: string
  fcmToken?: string         // Token FCM del dispositivo para registrarlo al login
}

export interface LoginResponse {
  user: UserPublic
  accessToken: string
  refreshToken: string
  expiresIn: number         // Segundos
}

// ─── Refresh ──────────────────────────────────────────────────────────────────
export interface RefreshTokenDto {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  expiresIn: number
}

// ─── JWT Payload ─────────────────────────────────────────────────────────────
export interface JwtPayload {
  sub: string               // userId
  email: string
  role: UserRole
  groupId?: string
  iat: number
  exp: number
}

// ─── Cambio de contraseña ─────────────────────────────────────────────────────
export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

// ─── Respuestas de API genéricas ──────────────────────────────────────────────
export interface ApiResponse<T = undefined> {
  success: boolean
  data?: T
  message?: string
  error?: string
  statusCode: number
}

export interface ApiError {
  success: false
  error: string
  message: string
  statusCode: number
  details?: Record<string, string[]>   // Errores de validación por campo
}
