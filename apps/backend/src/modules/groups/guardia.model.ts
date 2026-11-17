import mongoose, { type Document, type Model, Schema } from 'mongoose'
import type { GuardiaStatus } from '@caixalertas/types'

export interface IGuardiaDocument extends Document {
  _id: mongoose.Types.ObjectId
  groupId: mongoose.Types.ObjectId
  name: string
  memberIds: mongoose.Types.ObjectId[]
  responsableId?: mongoose.Types.ObjectId
  startAt: Date
  endAt: Date
  status: GuardiaStatus
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const guardiaSchema = new Schema<IGuardiaDocument>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
    name: { type: String, required: true, trim: true },
    memberIds: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    responsableId: { type: Schema.Types.ObjectId, ref: 'User' },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    notes: { type: String },
  },
  {
    timestamps: true,
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

guardiaSchema.index({ groupId: 1, status: 1, startAt: 1 })

export const GuardiaModel: Model<IGuardiaDocument> = mongoose.model<IGuardiaDocument>(
  'Guardia',
  guardiaSchema,
)
