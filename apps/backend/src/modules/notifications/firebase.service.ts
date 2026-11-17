import admin from 'firebase-admin'
import type { FcmPayload } from '@caixalertas/types'
import { config } from '../../config'
import { logger } from '../../utils/logger'

let firebaseApp: admin.app.App | null = null

export const initFirebase = (): void => {
  if (!config.firebase.projectId) {
    logger.warn('Firebase not configured — push notifications disabled')
    return
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    }),
  })

  logger.info(`Firebase initialized for project: ${config.firebase.projectId}`)
}

export const sendPushNotification = async (payload: FcmPayload): Promise<void> => {
  if (!firebaseApp) {
    logger.warn('Firebase not initialized — skipping push notification')
    return
  }

  const tokens = Array.isArray(payload.token) ? payload.token : [payload.token]
  if (tokens.length === 0) return

  try {
    if (tokens.length === 1) {
      await admin.messaging(firebaseApp).send({
        token: tokens[0],
        notification: { title: payload.title, body: payload.body, imageUrl: payload.imageUrl },
        data: payload.data,
        android: { priority: payload.priority === 'high' ? 'high' : 'normal', collapseKey: payload.collapseKey, ttl: (payload.ttl ?? 86400) * 1000 },
        apns: {
          payload: { aps: { sound: payload.sound ?? 'default', badge: payload.badge } },
          headers: { 'apns-priority': payload.priority === 'high' ? '10' : '5', 'apns-collapse-id': payload.collapseKey ?? '' },
        },
        webpush: { notification: { title: payload.title, body: payload.body } },
      })
    } else {
      const response = await admin.messaging(firebaseApp).sendEachForMulticast({
        tokens,
        notification: { title: payload.title, body: payload.body },
        data: payload.data,
        android: { priority: payload.priority === 'high' ? 'high' : 'normal' },
        apns: { payload: { aps: { sound: payload.sound ?? 'default' } } },
      })

      logger.info(`Push sent: ${response.successCount} ok, ${response.failureCount} failed`)

      // Log tokens inválidos para limpiarlos
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          logger.warn(`Invalid FCM token: ${tokens[idx]}`, { error: resp.error?.message })
        }
      })
    }
  } catch (error) {
    logger.error('Firebase push error:', error)
  }
}
