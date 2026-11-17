import type { LoginDto, LoginResponse, RefreshTokenResponse } from '@caixalertas/types'
import { UserModel } from '../users/user.model'
import { signAccessToken, signRefreshToken, verifyRefreshToken, getAccessTokenTtlSeconds } from '../../utils/jwt'
import { AppError } from '../../middleware/errorHandler.middleware'
import { logger } from '../../utils/logger'

export class AuthService {
  async login(dto: LoginDto, fcmToken?: string): Promise<LoginResponse> {
    const user = await UserModel.findOne({ email: dto.email.toLowerCase() })
      .select('+passwordHash +fcmTokens')

    if (!user || !user.isActive) {
      throw new AppError(401, 'UNAUTHORIZED', 'Email o contraseña incorrectos')
    }

    if (user.isLocked()) {
      throw new AppError(401, 'ACCOUNT_LOCKED', 'Cuenta bloqueada temporalmente. Inténtalo más tarde.')
    }

    const isValid = await user.comparePassword(dto.password)
    if (!isValid) {
      await user.incrementLoginAttempts()
      logger.warn(`Failed login attempt for ${dto.email}`)
      throw new AppError(401, 'UNAUTHORIZED', 'Email o contraseña incorrectos')
    }

    await user.resetLoginAttempts()

    if (fcmToken && !user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken)
      await user.save()
    }

    const accessToken = signAccessToken({
      id: user.id as string,
      email: user.email,
      role: user.role,
      groupId: user.groupId?.toString(),
    })
    const refreshToken = signRefreshToken(user.id as string)

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
      expiresIn: getAccessTokenTtlSeconds(),
    }
  }

  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    let payload: { sub: string }
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired refresh token')
    }

    const user = await UserModel.findById(payload.sub)
    if (!user || !user.isActive) {
      throw new AppError(401, 'UNAUTHORIZED', 'User not found or inactive')
    }

    const accessToken = signAccessToken({
      id: user.id as string,
      email: user.email,
      role: user.role,
      groupId: user.groupId?.toString(),
    })

    return { accessToken, expiresIn: getAccessTokenTtlSeconds() }
  }

  async logout(userId: string, fcmToken?: string): Promise<void> {
    if (fcmToken) {
      await UserModel.updateOne({ _id: userId }, { $pull: { fcmTokens: fcmToken } })
    }
  }

  async getProfile(userId: string) {
    const user = await UserModel.findById(userId)
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found')
    return user.toJSON()
  }
}
