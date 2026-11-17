import app from './app'
import { config } from './config'
import { connectDatabase } from './database/connection'
import { initFirebase } from './modules/notifications/firebase.service'
import { logger } from './utils/logger'

const bootstrap = async (): Promise<void> => {
  // Conecta la base de datos
  await connectDatabase()

  // Inicializa Firebase Admin
  initFirebase()

  // Arranca el servidor
  const server = app.listen(config.server.port, () => {
    logger.info(`CaixAlertas backend running on port ${config.server.port} [${config.env}]`)
    logger.info(`API: http://localhost:${config.server.port}${config.server.apiPrefix}`)
    logger.info(`Health: http://localhost:${config.server.port}/health`)
  })

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`)
    server.close(async () => {
      const { disconnectDatabase } = await import('./database/connection')
      await disconnectDatabase()
      logger.info('Server shut down')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err)
    process.exit(1)
  })
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason)
    process.exit(1)
  })
}

void bootstrap()
