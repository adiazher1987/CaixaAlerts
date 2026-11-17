import { Router, type NextFunction, type Request, type Response } from 'express'
import Joi from 'joi'
import { authenticate } from '../../middleware/auth.middleware'
import { AppError } from '../../middleware/errorHandler.middleware'
import { sendNoContent } from '../../utils/responses'
import { NotificationService } from './notification.service'

const router = Router()
const service = new NotificationService()

const tokenSchema = Joi.object({
  token: Joi.string().trim().min(1).max(4096).required(),
  platform: Joi.string().valid('android', 'ios', 'web').required(),
})

router.use(authenticate)

router.post('/fcm-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = tokenSchema.validate(req.body)
    if (error) throw new AppError(400, 'BAD_REQUEST', error.message)

    const userId = req.user?.sub
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated')

    await service.registerFcmToken(userId, value.token)
    sendNoContent(res)
  } catch (error) {
    next(error)
  }
})

router.delete('/fcm-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = Joi.object({
      token: Joi.string().trim().min(1).max(4096).required(),
    }).validate(req.body)
    if (error) throw new AppError(400, 'BAD_REQUEST', error.message)

    const userId = req.user?.sub
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated')

    await service.removeFcmToken(userId, value.token)
    sendNoContent(res)
  } catch (error) {
    next(error)
  }
})

export default router
