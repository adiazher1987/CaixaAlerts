import jwt from 'jsonwebtoken'
import type { JwtPayload, UserRole } from '@caixalertas/types'
import { config } from '../config'

interface TokenUserData {
  id: string
  email: string
  role: UserRole
  groupId?: string
}

export const signAccessToken = (user: TokenUserData): string => {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, groupId: user.groupId },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn } as jwt.SignOptions,
  )
}

export const signRefreshToken = (userId: string): string => {
  return jwt.sign({ sub: userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions)
}

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as JwtPayload
}

export const verifyRefreshToken = (token: string): { sub: string } => {
  return jwt.verify(token, config.jwt.refreshSecret) as { sub: string }
}

// Calcula los segundos hasta la expiración del access token
export const getAccessTokenTtlSeconds = (): number => {
  const expires = config.jwt.accessExpiresIn
  if (expires.endsWith('m')) return parseInt(expires) * 60
  if (expires.endsWith('h')) return parseInt(expires) * 3600
  if (expires.endsWith('d')) return parseInt(expires) * 86400
  return 900
}
