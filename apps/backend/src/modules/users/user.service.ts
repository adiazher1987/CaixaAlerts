import type { CreateUserDto, UpdateUserDto } from '@caixalertas/types'
import { UserModel } from './user.model'
import { AppError } from '../../middleware/errorHandler.middleware'

export class UserService {
  async list(groupId?: string) {
    const filter = groupId ? { groupId } : {}
    const users = await UserModel.find(filter).sort({ createdAt: -1 })
    return users.map((u) => u.toJSON())
  }

  async getById(id: string) {
    const user = await UserModel.findById(id)
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found')
    return user.toJSON()
  }

  async create(dto: CreateUserDto) {
    const existing = await UserModel.findOne({ email: dto.email.toLowerCase() })
    if (existing) throw new AppError(409, 'CONFLICT', 'Email already in use')

    // El hook pre('save') del modelo se encarga de hashear passwordHash
    const user = new UserModel({
      ...dto,
      email: dto.email.toLowerCase(),
      passwordHash: dto.password,
    })
    await user.save()
    return user.toJSON()
  }

  async update(id: string, dto: UpdateUserDto) {
    const { password, ...rest } = dto

    if (password) {
      // Usar find+save para que el hook pre('save') hashee la contraseña
      const user = await UserModel.findById(id)
      if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found')
      Object.assign(user, rest)
      user.passwordHash = password
      await user.save()
      return user.toJSON()
    }

    const user = await UserModel.findByIdAndUpdate(id, rest, { new: true, runValidators: true })
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found')
    return user.toJSON()
  }

  async deactivate(id: string) {
    const user = await UserModel.findByIdAndUpdate(id, { isActive: false }, { new: true })
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found')
    return user.toJSON()
  }

  async unlock(id: string) {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { $unset: { lockedUntil: 1 }, $set: { loginAttempts: 0 } },
      { new: true },
    )
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found')
    return user.toJSON()
  }
}
