import { Router, type Request, type Response, type NextFunction } from 'express'
import { AuthService } from './auth.service'
import { authenticate } from '../../middleware/auth.middleware'
import { loginRateLimiter } from '../../middleware/rateLimiter.middleware'
import { sendSuccess, sendNoContent } from '../../utils/responses'
import { AppError } from '../../middleware/errorHandler.middleware'
import Joi from 'joi'

const router = Router()
const service = new AuthService()

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
  fcmToken: Joi.string().optional(),
})

router.post('/login', loginRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = loginSchema.validate(req.body)
    if (error) throw new AppError(400, 'BAD_REQUEST', error.message)
    const result = await service.login(value, value.fcmToken)
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
})

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string }
    if (!refreshToken) throw new AppError(400, 'BAD_REQUEST', 'refreshToken is required')
    const result = await service.refresh(refreshToken)
    sendSuccess(res, result)
  } catch (err) {
    next(err)
  }
})

router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fcmToken } = req.body as { fcmToken?: string }
    await service.logout(req.user?.sub ?? '', fcmToken)
    sendNoContent(res)
  } catch (err) {
    next(err)
  }
})

router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await service.getProfile(req.user?.sub ?? '')
    sendSuccess(res, profile)
  } catch (err) {
    next(err)
  }
})

export default router
