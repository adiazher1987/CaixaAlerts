import rateLimit from 'express-rate-limit'
import { config } from '../config'

// Limitador global
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests. Please try again later.',
    statusCode: 429,
  },
})

// Limitador estricto para login — en dev se puede subir con LOGIN_RATE_LIMIT_MAX
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many login attempts. Please try again in 15 minutes.',
    statusCode: 429,
  },
})
