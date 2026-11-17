import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import morgan from 'morgan'
import { config } from './config'
import { logger } from './utils/logger'
import { globalRateLimiter } from './middleware/rateLimiter.middleware'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware'

// Rutas
import authRoutes from './modules/auth/auth.routes'
import incidentRoutes from './modules/incidents/incident.routes'
import userRoutes from './modules/users/user.routes'
import estructuraRoutes from './modules/estructura/estructura.routes'
import notificationRoutes from './modules/notifications/notification.routes'

const app = express()

// ── Seguridad ─────────────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: config.isProd,
    crossOriginEmbedderPolicy: config.isProd,
  }),
)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.cors.origins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

// ── Parsing y compresión ──────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(compression())

// ── Logging HTTP ──────────────────────────────────────────────────────────────
app.use(
  morgan(config.isDev ? 'dev' : 'combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }),
)

// ── Rate limiting global ──────────────────────────────────────────────────────
app.use(globalRateLimiter)

// ── Healthcheck ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: config.env, timestamp: new Date().toISOString() })
})

// ── API Routes ────────────────────────────────────────────────────────────────
const apiPrefix = config.server.apiPrefix

app.use(`${apiPrefix}/auth`, authRoutes)
app.use(`${apiPrefix}/incidents`, incidentRoutes)
app.use(`${apiPrefix}/users`, userRoutes)
app.use(`${apiPrefix}/estructura`, estructuraRoutes)
app.use(`${apiPrefix}/notifications`, notificationRoutes)

// ── Error handling (debe ir al final) ────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

export default app
