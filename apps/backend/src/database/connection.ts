import mongoose from 'mongoose'
import { config } from '../config'
import { logger } from '../utils/logger'

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set('strict', true)
    mongoose.set('strictQuery', true)

    await mongoose.connect(config.db.uri, {
      dbName: config.db.name,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    logger.info(`MongoDB connected: ${config.db.name}`)

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Retrying...')
    })
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error)
    process.exit(1)
  }
}

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect()
  logger.info('MongoDB disconnected gracefully')
}
