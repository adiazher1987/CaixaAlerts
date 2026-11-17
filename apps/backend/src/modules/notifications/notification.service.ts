import type { NotificationType, NotificationData, NotificationFilters, PaginatedResult } from '@caixalertas/types'
import { NotificationModel, type INotificationDocument } from './notification.model'
import { UserModel } from '../users/user.model'
import { GuardiaModel } from '../groups/guardia.model'
import { sendPushNotification } from './firebase.service'
import { logger } from '../../utils/logger'

export class NotificationService {
  // Crea una notificación en BD y envía push
  async send(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: NotificationData,
  ): Promise<INotificationDocument> {
    const notification = await NotificationModel.create({ userId, type, title, body, data })

    // Obtiene tokens FCM del usuario (campo excluido por defecto)
    const user = await UserModel.findById(userId).select('+fcmTokens')
    if (user?.fcmTokens && user.fcmTokens.length > 0) {
      await sendPushNotification({
        token: user.fcmTokens,
        title,
        body,
        data: data ? this.serializeData(data) : undefined,
        priority: 'high',
        collapseKey: data?.incidentId,
      })
    }

    return notification
  }

  // Notifica a todos los miembros de la guardia activa de un grupo
  async notifyActiveGuardia(
    groupId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: NotificationData,
  ): Promise<void> {
    try {
      const now = new Date()
      const guardia = await GuardiaModel.findOne({
        groupId,
        status: 'active',
        startAt: { $lte: now },
        endAt: { $gte: now },
      })

      if (!guardia) {
        logger.warn(`No active guardia found for group ${groupId}`)
        return
      }

      await Promise.all(
        guardia.memberIds.map((memberId) =>
          this.send(memberId.toString(), type, title, body, data).catch((err) =>
            logger.error(`Failed to notify user ${memberId.toString()}:`, err),
          ),
        ),
      )
    } catch (error) {
      logger.error('notifyActiveGuardia error:', error)
    }
  }

  async listForUser(userId: string, filters: NotificationFilters): Promise<PaginatedResult<INotificationDocument>> {
    const { page = 1, limit = 20, isRead, type } = filters
    const query: Record<string, unknown> = { userId }
    if (isRead !== undefined) query['isRead'] = isRead
    if (type) query['type'] = type

    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      NotificationModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      NotificationModel.countDocuments(query),
    ])

    const totalPages = Math.ceil(total / limit)
    return { data, total, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 }
  }

  async getUnreadCount(userId: string): Promise<number> {
    return NotificationModel.countDocuments({ userId, isRead: false })
  }

  async markRead(userId: string, notificationIds: string[]): Promise<void> {
    await NotificationModel.updateMany(
      { _id: { $in: notificationIds }, userId },
      { $set: { isRead: true, readAt: new Date() } },
    )
  }

  async markAllRead(userId: string): Promise<void> {
    await NotificationModel.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    )
  }

  async registerFcmToken(userId: string, token: string): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      { $addToSet: { fcmTokens: token } },
    )
  }

  async removeFcmToken(userId: string, token: string): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      { $pull: { fcmTokens: token } },
    )
  }

  // FCM solo acepta valores string en el campo data
  private serializeData(data: NotificationData): Record<string, string> {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    )
  }
}
