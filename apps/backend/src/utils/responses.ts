import type { Response } from 'express'
import type { ApiResponse, ApiError } from '@caixalertas/types'

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string,
): Response => {
  const body: ApiResponse<T> = { success: true, data, statusCode, message }
  return res.status(statusCode).json(body)
}

export const sendCreated = <T>(res: Response, data: T, message?: string): Response => {
  return sendSuccess(res, data, 201, message)
}

export const sendNoContent = (res: Response): Response => {
  return res.status(204).send()
}

export const sendError = (
  res: Response,
  error: string,
  message: string,
  statusCode: number,
  details?: Record<string, string[]>,
): Response => {
  const body: ApiError = { success: false, error, message, statusCode, details }
  return res.status(statusCode).json(body)
}

export const sendBadRequest = (
  res: Response,
  message: string,
  details?: Record<string, string[]>,
): Response => sendError(res, 'BAD_REQUEST', message, 400, details)

export const sendUnauthorized = (res: Response, message = 'Unauthorized'): Response =>
  sendError(res, 'UNAUTHORIZED', message, 401)

export const sendForbidden = (res: Response, message = 'Forbidden'): Response =>
  sendError(res, 'FORBIDDEN', message, 403)

export const sendNotFound = (res: Response, resource = 'Resource'): Response =>
  sendError(res, 'NOT_FOUND', `${resource} not found`, 404)

export const sendConflict = (res: Response, message: string): Response =>
  sendError(res, 'CONFLICT', message, 409)

export const sendInternalError = (res: Response, message = 'Internal server error'): Response =>
  sendError(res, 'INTERNAL_SERVER_ERROR', message, 500)
