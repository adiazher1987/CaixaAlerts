import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import type { UserPublic } from '@caixalertas/types'
import { getApiClient } from '@caixalertas/api-client'

// expo-secure-store no funciona en web — usamos localStorage como fallback
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key)
    return SecureStore.getItemAsync(key)
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return }
    return SecureStore.setItemAsync(key, value)
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return }
    return SecureStore.deleteItemAsync(key)
  },
}

const KEYS = {
  ACCESS_TOKEN: 'ca_access_token',
  REFRESH_TOKEN: 'ca_refresh_token',
  USER: 'ca_user',
} as const

interface AuthState {
  user: UserPublic | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // Acciones
  login: (email: string, password: string, fcmToken?: string) => Promise<void>
  logout: () => Promise<void>
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>
  loadFromStorage: () => Promise<void>
  updateAccessToken: (token: string) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  loadFromStorage: async () => {
    try {
      const [accessToken, refreshToken, userJson] = await Promise.all([
        storage.getItem(KEYS.ACCESS_TOKEN),
        storage.getItem(KEYS.REFRESH_TOKEN),
        storage.getItem(KEYS.USER),
      ])

      if (accessToken && refreshToken && userJson) {
        const user = JSON.parse(userJson) as UserPublic
        set({ accessToken, refreshToken, user, isAuthenticated: true })
      }
    } catch {
      // Tokens corruptos — limpia el estado directamente sin llamar al API
      await Promise.all([
        storage.deleteItem(KEYS.ACCESS_TOKEN),
        storage.deleteItem(KEYS.REFRESH_TOKEN),
        storage.deleteItem(KEYS.USER),
      ]).catch(() => {})
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
    } finally {
      set({ isLoading: false })
    }
  },

  login: async (email, password, fcmToken) => {
    const response = await getApiClient().auth.login({ email, password, fcmToken })
    if (!response.data) throw new Error('Login failed')

    const { user, accessToken, refreshToken } = response.data
    await get().setTokens(accessToken, refreshToken)
    await storage.setItem(KEYS.USER, JSON.stringify(user))
    set({ user, isAuthenticated: true })
  },

  logout: async () => {
    try {
      const { refreshToken } = get()
      if (refreshToken) {
        await getApiClient().auth.logout(refreshToken)
      }
    } catch {
      // Continúa aunque falle el logout en el servidor
    } finally {
      await Promise.all([
        storage.deleteItem(KEYS.ACCESS_TOKEN),
        storage.deleteItem(KEYS.REFRESH_TOKEN),
        storage.deleteItem(KEYS.USER),
      ])
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
    }
  },

  setTokens: async (accessToken, refreshToken) => {
    await Promise.all([
      storage.setItem(KEYS.ACCESS_TOKEN, accessToken),
      storage.setItem(KEYS.REFRESH_TOKEN, refreshToken),
    ])
    set({ accessToken, refreshToken })
  },

  updateAccessToken: (token) => {
    void storage.setItem(KEYS.ACCESS_TOKEN, token)
    set({ accessToken: token })
  },
}))
