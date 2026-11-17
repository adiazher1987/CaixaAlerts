import type { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'
import { sendInternalError, sendBadRequest } from '../utils/responses'

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly error: string,
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Middleware de manejo global de errores (debe tener 4 parámetros)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.error,
      message: err.message,
      statusCode: err.statusCode,
      details: err.details,
    })
    return
  }

  // Errores de validación de Mongoose
  if (err.name === 'ValidationError') {
    sendBadRequest(res, 'Validation error')
    return
  }

  // Errores de cast de Mongoose (ID inválido)
  if (err.name === 'CastError') {
    sendBadRequest(res, 'Invalid ID format')
    return
  }

  logger.error('Unhandled error:', { error: err.message, stack: err.stack, path: req.path })
  sendInternalError(res)
}

// Maneja rutas no encontradas (404)
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
  })
}
