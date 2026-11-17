import type { Request, Response, NextFunction } from 'express'
import type { UserRole, JwtPayload } from '@caixalertas/types'
import { verifyAccessToken } from '../utils/jwt'
import { sendUnauthorized, sendForbidden } from '../utils/responses'

// Extiende el tipo Request de Express para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    sendUnauthorized(res, 'Missing or invalid Authorization header')
    return
  }

  const token = authHeader.slice(7)
  try {
    req.user = verifyAccessToken(token)
    next()
  } catch {
    sendUnauthorized(res, 'Invalid or expired token')
  }
}

// Middleware de autorización por rol — usa después de authenticate
export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'Not authenticated')
      return
    }
    if (!roles.includes(req.user.role)) {
      sendForbidden(res, 'Insufficient permissions')
      return
    }
    next()
  }

// Permite acceso solo al propio usuario o a superadmin
export const authorizeSelfOrAdmin =
  (userIdParam = 'id') =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'Not authenticated')
      return
    }
    const targetId = req.params[userIdParam]
    if (req.user.sub === targetId || req.user.role === 'superadmin') {
      next()
      return
    }
    sendForbidden(res, 'Insufficient permissions')
  }
