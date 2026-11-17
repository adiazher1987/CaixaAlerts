import mongoose, { type Document, type Model, Schema } from 'mongoose'
import type { NotificationType, NotificationData } from '@caixalertas/types'

export interface INotificationDocument extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  type: NotificationType
  title: string
  body: string
  data?: NotificationData
  isRead: boolean
  readAt?: Date
  createdAt: Date
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret['id'] = ret['_id']
        delete ret['_id']
        delete ret['__v']
        return ret
      },
    },
  },
)

notificationSchema.index({ userId: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, isRead: 1 })

export const NotificationModel: Model<INotificationDocument> = mongoose.model<INotificationDocument>(
  'Notification',
  notificationSchema,
)
