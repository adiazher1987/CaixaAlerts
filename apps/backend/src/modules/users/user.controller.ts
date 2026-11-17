import type { Request, Response, NextFunction } from 'express'
import { UserService } from './user.service'
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/responses'
import { AppError } from '../../middleware/errorHandler.middleware'

export class UserController {
  constructor(private readonly service: UserService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // admin_grupo solo ve usuarios de su grupo
      const groupId =
        req.user?.role === 'admin_grupo' ? req.user.groupId : (req.query['groupId'] as string | undefined)
      const users = await this.service.list(groupId)
      sendSuccess(res, users)
    } catch (err) {
      next(err)
    }
  }

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.getById(req.params['id'] ?? '')
      sendSuccess(res, user)
    } catch (err) {
      next(err)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.create(req.body)
      sendCreated(res, user, 'User created successfully')
    } catch (err) {
      next(err)
    }
  }

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.update(req.params['id'] ?? '', req.body)
      sendSuccess(res, user)
    } catch (err) {
      next(err)
    }
  }

  unlock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.unlock(req.params['id'] ?? '')
      sendSuccess(res, user)
    } catch (err) {
      next(err)
    }
  }

  deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.user?.sub ?? ''
      if (requesterId === req.params['id']) {
        throw new AppError(400, 'BAD_REQUEST', 'Cannot deactivate your own account')
      }
      await this.service.deactivate(req.params['id'] ?? '')
      sendNoContent(res)
    } catch (err) {
      next(err)
    }
  }
}
