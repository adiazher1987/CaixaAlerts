import 'dotenv/config'
import path from 'path'
import dotenv from 'dotenv'

// Carga el fichero .env del entorno actual
const APP_ENV = process.env['APP_ENV'] ?? 'development'
dotenv.config({ path: path.resolve(process.cwd(), `.env.${APP_ENV}`) })

type AppEnv = 'development' | 'staging' | 'production' | 'test'

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

export const config = {
  env: APP_ENV as AppEnv,
  isDev: APP_ENV === 'development',
  isProd: APP_ENV === 'production',
  isTest: APP_ENV === 'test',

  server: {
    port: parseInt(optionalEnv('BACKEND_PORT', '3000'), 10),
    apiPrefix: optionalEnv('BACKEND_API_PREFIX', '/api/v1'),
  },

  db: {
    uri: requireEnv('MONGODB_URI'),
    name: optionalEnv('MONGODB_DB_NAME', 'caixalertas'),
  },

  redis: {
    url: optionalEnv('REDIS_URL', 'redis://localhost:6379'),
  },

  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    accessExpiresIn: optionalEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optionalEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  cors: {
    origins: optionalEnv('CORS_ORIGINS', 'http://localhost:8081').split(',').map((o) => o.trim()),
  },

  rateLimit: {
    windowMs: parseInt(optionalEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    maxRequests: parseInt(optionalEnv('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  },

  firebase: {
    projectId: optionalEnv('FIREBASE_PROJECT_ID', ''),
    clientEmail: optionalEnv('FIREBASE_CLIENT_EMAIL', ''),
    // La clave privada viene con \n escapados en la variable de entorno
    privateKey: optionalEnv('FIREBASE_PRIVATE_KEY', '').replace(/\\n/g, '\n'),
  },

  email: {
    host: optionalEnv('SMTP_HOST', ''),
    port: parseInt(optionalEnv('SMTP_PORT', '587'), 10),
    user: optionalEnv('SMTP_USER', ''),
    pass: optionalEnv('SMTP_PASS', ''),
    from: optionalEnv('EMAIL_FROM', 'CaixAlertas <noreply@caixalertas.local>'),
  },

  logging: {
    level: optionalEnv('LOG_LEVEL', 'info'),
  },

  // Seguridad: nº de intentos fallidos antes de bloquear la cuenta
  auth: {
    maxLoginAttempts: 5,
    lockDurationMinutes: 30,
    bcryptRounds: 12,
  },
} as const

export type Config = typeof config
