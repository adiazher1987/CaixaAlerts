import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@caixalertas/types'

export interface ApiClientConfig {
  baseURL: string
  timeout?: number
  getAccessToken: () => string | null
  getRefreshToken: () => string | null
  onTokenRefreshed: (accessToken: string) => void
  onAuthFailure: () => void
}

// Función de espera para peticiones en cola durante el refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else if (token) {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

export const createApiClient = (config: ApiClientConfig): AxiosInstance => {
  const client = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout ?? 15000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })

  // ── Request interceptor: añade el token de acceso ─────────────────────────
  client.interceptors.request.use(
    (req: InternalAxiosRequestConfig) => {
      const token = config.getAccessToken()
      if (token && req.headers) {
        req.headers.Authorization = `Bearer ${token}`
      }
      return req
    },
    (error) => Promise.reject(error),
  )

  // ── Response interceptor: gestiona refresh automático ─────────────────────
  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error)) return Promise.reject(error)

      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

      const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')

      if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        if (isRefreshing) {
          // Encola la petición hasta que el refresh termine
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`
            }
            return client(originalRequest)
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        const refreshToken = config.getRefreshToken()
        if (!refreshToken) {
          config.onAuthFailure()
          return Promise.reject(error)
        }

        try {
          const { data } = await axios.post<{ accessToken: string }>(
            `${config.baseURL}/auth/refresh`,
            { refreshToken },
          )
          config.onTokenRefreshed(data.accessToken)
          processQueue(null, data.accessToken)
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`
          }
          return client(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          config.onAuthFailure()
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }

      // Normaliza el error para que siempre tenga la forma ApiError
      const apiError: ApiError = {
        success: false,
        error: (error.response?.data as ApiError)?.error ?? 'UNKNOWN_ERROR',
        message: (error.response?.data as ApiError)?.message ?? 'An unexpected error occurred',
        statusCode: error.response?.status ?? 0,
        details: (error.response?.data as ApiError)?.details,
      }

      return Promise.reject(apiError)
    },
  )

  return client
}
