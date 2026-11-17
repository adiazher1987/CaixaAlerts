import mongoose, { type Document, type Model, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'
import type { UserRole } from '@caixalertas/types'
import { config } from '../../config'

export interface IUserDocument extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  passwordHash: string
  name: string
  phone?: string
  role: UserRole
  groupId?: mongoose.Types.ObjectId
  fcmTokens: string[]
  biometricEnabled: boolean
  isActive: boolean
  loginAttempts: number
  lockedUntil?: Date
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  // Métodos de instancia
  comparePassword(candidate: string): Promise<boolean>
  isLocked(): boolean
  incrementLoginAttempts(): Promise<void>
  resetLoginAttempts(): Promise<void>
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['superadmin', 'responsable_cliente', 'responsable_grupo', 'responsable_guardia', 'miembro_guardia', 'readonly'],
      required: true,
      default: 'guardia',
    },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    fcmTokens: { type: [String], default: [], select: false },
    biometricEnabled: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret['id'] = ret['_id']
        delete ret['_id']
        delete ret['__v']
        delete ret['passwordHash']
        delete ret['fcmTokens']
        ret['isLocked'] = ret['lockedUntil'] ? new Date(ret['lockedUntil']) > new Date() : false
        delete ret['loginAttempts']
        delete ret['lockedUntil']
        return ret
      },
    },
  },
)

// ── Métodos de instancia ──────────────────────────────────────────────────────
userSchema.methods['comparePassword'] = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash as string)
}

userSchema.methods['isLocked'] = function (): boolean {
  if (!this.lockedUntil) return false
  return (this.lockedUntil as Date) > new Date()
}

userSchema.methods['incrementLoginAttempts'] = async function (): Promise<void> {
  const attempts = (this.loginAttempts as number) + 1
  const update: Partial<IUserDocument> = { loginAttempts: attempts }
  if (attempts >= config.auth.maxLoginAttempts) {
    const lockUntil = new Date()
    lockUntil.setMinutes(lockUntil.getMinutes() + config.auth.lockDurationMinutes)
    update.lockedUntil = lockUntil
  }
  await (this as IUserDocument).updateOne(update)
}

userSchema.methods['resetLoginAttempts'] = async function (): Promise<void> {
  await (this as IUserDocument).updateOne({
    $unset: { lockedUntil: 1 },
    $set: { loginAttempts: 0, lastLoginAt: new Date() },
  })
}

// ── Hook: hashea la contraseña antes de guardar ───────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next()
  this.passwordHash = await bcrypt.hash(this.passwordHash, config.auth.bcryptRounds)
  next()
})

export const UserModel: Model<IUserDocument> = mongoose.model<IUserDocument>('User', userSchema)
