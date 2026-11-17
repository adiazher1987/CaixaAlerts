import type { AxiosInstance } from 'axios'
import type {
  LoginDto,
  LoginResponse,
  RefreshTokenDto,
  RefreshTokenResponse,
  ChangePasswordDto,
  ApiResponse,
} from '@caixalertas/types'

export const createAuthEndpoints = (client: AxiosInstance) => ({
  login: (dto: LoginDto) =>
    client.post<ApiResponse<LoginResponse>>('/auth/login', dto).then((r) => r.data),

  logout: (refreshToken: string) =>
    client.post<ApiResponse>('/auth/logout', { refreshToken }).then((r) => r.data),

  refresh: (dto: RefreshTokenDto) =>
    client.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', dto).then((r) => r.data),

  changePassword: (dto: ChangePasswordDto) =>
    client.post<ApiResponse>('/auth/change-password', dto).then((r) => r.data),

  me: () =>
    client.get<ApiResponse<LoginResponse['user']>>('/auth/me').then((r) => r.data),
})
