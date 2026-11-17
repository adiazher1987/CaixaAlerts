import React, { useEffect, type ReactNode } from 'react'
import { initApiClient } from '@caixalertas/api-client'
import { ENV } from '../config/env'
import { useAuthStore } from '../stores/auth.store'

interface ApiProviderProps {
  children: ReactNode
}

// Inicializa el cliente de API con las funciones de acceso a tokens del store
export const ApiProvider = ({ children }: ApiProviderProps) => {
  const { accessToken, refreshToken, updateAccessToken, logout } = useAuthStore()

  useEffect(() => {
    initApiClient({
      baseURL: ENV.apiUrl,
      getAccessToken: () => useAuthStore.getState().accessToken,
      getRefreshToken: () => useAuthStore.getState().refreshToken,
      onTokenRefreshed: (token) => updateAccessToken(token),
      onAuthFailure: () => void logout(),
    })
  }, [])

  return <>{children}</>
}
