import type { Request, Response, NextFunction } from 'express'
import type { IncidentFilters } from '@caixalertas/types'
import { IncidentService } from './incident.service'
import { sendSuccess, sendCreated } from '../../utils/responses'
import { validateCreateIncident, validateEscalate, validateResolve } from './incident.validation'
import { AppError } from '../../middleware/errorHandler.middleware'

export class IncidentController {
  constructor(private readonly service: IncidentService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as unknown as IncidentFilters
      const result = await this.service.list(filters)
      sendSuccess(res, result)
    } catch (err) {
      next(err)
    }
  }

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const incident = await this.service.getById(req.params['id'] ?? '')
      sendSuccess(res, incident)
    } catch (err) {
      next(err)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = validateCreateIncident(req.body)
      if (error) throw new AppError(400, 'BAD_REQUEST', error.message)

      const user = req.user
      if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated')

      const incident = await this.service.create(
        value,
        user.sub,
        user.email,
        user.role,
        user.groupId,
      )
      sendCreated(res, incident, 'Incident created successfully')
    } catch (err) {
      next(err)
    }
  }

  acknowledge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user
      if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated')
      const incident = await this.service.acknowledge(
        { incidentId: req.params['id'] ?? '', ...req.body },
        user.sub,
        user.email,
      )
      sendSuccess(res, incident)
    } catch (err) {
      next(err)
    }
  }

  escalate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = validateEscalate(req.body)
      if (error) throw new AppError(400, 'BAD_REQUEST', error.message)
      const user = req.user
      if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated')
      const incident = await this.service.escalate(
        { incidentId: req.params['id'] ?? '', ...value },
        user.sub,
        user.email,
      )
      sendSuccess(res, incident)
    } catch (err) {
      next(err)
    }
  }

  resolve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = validateResolve(req.body)
      if (error) throw new AppError(400, 'BAD_REQUEST', error.message)
      const user = req.user
      if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated')
      const incident = await this.service.resolve(
        { incidentId: req.params['id'] ?? '', ...value },
        user.sub,
        user.email,
      )
      sendSuccess(res, incident)
    } catch (err) {
      next(err)
    }
  }

  addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user
      if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated')
      const incident = await this.service.addComment(
        { incidentId: req.params['id'] ?? '', message: req.body.message },
        user.sub,
        user.email,
      )
      sendSuccess(res, incident)
    } catch (err) {
      next(err)
    }
  }
}
