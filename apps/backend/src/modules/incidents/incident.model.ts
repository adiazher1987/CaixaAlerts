import mongoose, { type Document, type Model, Schema } from 'mongoose'
import type {
  IncidentSeverity,
  IncidentStatus,
  EscalationLevel,
  TimelineEventType,
} from '@caixalertas/types'
import { SEVERITY_SLA_MINUTES } from '@caixalertas/types'

export interface ITimelineEvent {
  _id: mongoose.Types.ObjectId
  type: TimelineEventType
  userId: mongoose.Types.ObjectId
  userName: string
  message: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

export interface IIncidentDocument extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  description: string
  application?: string
  severity: IncidentSeverity
  status: IncidentStatus
  currentEscalationLevel: EscalationLevel
  originGroupId: mongoose.Types.ObjectId
  involvedGroupIds: mongoose.Types.ObjectId[]
  createdById: mongoose.Types.ObjectId
  acknowledgedById?: mongoose.Types.ObjectId
  acknowledgedAt?: Date
  resolvedById?: mongoose.Types.ObjectId
  resolvedAt?: Date
  resolutionSummary?: string
  rootCause?: string
  preventiveActions?: string
  closedAt?: Date
  slaDeadline: Date
  slaBreached: boolean
  externalCallerId?: string
  externalCallerPhone?: string
  timeline: ITimelineEvent[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const timelineSchema = new Schema<ITimelineEvent>(
  {
    type: {
      type: String,
      enum: [
        'created',
        'acknowledged',
        'escalated',
        'cross_group',
        'status_changed',
        'comment',
        'resolved',
        'closed',
        'auto_escalated',
      ],
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

const incidentSchema = new Schema<IIncidentDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    application: { type: String, trim: true },
    severity: {
      type: String,
      enum: ['P1', 'P2', 'P3', 'P4'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'acknowledged', 'in_progress', 'escalated', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    currentEscalationLevel: { type: Number, min: 1, max: 6, default: 1 },
    originGroupId: {
      type: Schema.Types.ObjectId,
      ref: 'NodoEstructura',
      required: true,
      index: true,
    },
    involvedGroupIds: [{ type: Schema.Types.ObjectId, ref: 'NodoEstructura' }],
    createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    acknowledgedById: { type: Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: { type: Date },
    resolvedById: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    resolutionSummary: { type: String },
    rootCause: { type: String },
    preventiveActions: { type: String },
    closedAt: { type: Date },
    slaDeadline: { type: Date, required: true, index: true },
    slaBreached: { type: Boolean, default: false, index: true },
    externalCallerId: { type: String },
    externalCallerPhone: { type: String },
    timeline: [timelineSchema],
    isActive: { type: Boolean, default: true, index: true },
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

// Índices compuestos para las queries más frecuentes
incidentSchema.index({ status: 1, createdAt: -1 })
incidentSchema.index({ originGroupId: 1, status: 1 })
incidentSchema.index({ slaDeadline: 1, slaBreached: 1 })

// El SLA debe existir antes de la validación de Mongoose, ya que es obligatorio.
incidentSchema.pre('validate', function (next) {
  if (this.isNew) {
    const slaMinutes = SEVERITY_SLA_MINUTES[this.severity]
    const deadline = new Date()
    deadline.setMinutes(deadline.getMinutes() + slaMinutes)
    this.slaDeadline = deadline
  }
  next()
})

export const IncidentModel: Model<IIncidentDocument> = mongoose.model<IIncidentDocument>(
  'Incident',
  incidentSchema,
)
