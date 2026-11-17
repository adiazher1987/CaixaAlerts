import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { getLocales } from 'expo-localization'
import * as SplashScreen from 'expo-splash-screen'
import { initI18n } from '@caixalertas/i18n'
import { ApiProvider } from '../src/providers/ApiProvider'
import { useAuthStore } from '../src/stores/auth.store'
import { setupNotificationListeners } from '../src/services/notifications.service'

// Mantiene el splash screen hasta que estemos listos
void SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,    // 2 minutos
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
})

// Inicializa i18n con el idioma del dispositivo
const deviceLang = getLocales()[0]?.languageCode ?? 'es'
const i18n = initI18n(deviceLang)

export default function RootLayout() {
  const { loadFromStorage, isLoading } = useAuthStore()

  useEffect(() => {
    void loadFromStorage()
    const cleanup = setupNotificationListeners()
    return cleanup
  }, [])

  useEffect(() => {
    if (!isLoading) {
      void SplashScreen.hideAsync()
    }
  }, [isLoading])

  if (isLoading) return null

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ApiProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </ApiProvider>
      </I18nextProvider>
    </QueryClientProvider>
  )
}
