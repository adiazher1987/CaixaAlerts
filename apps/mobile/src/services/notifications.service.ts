import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { router } from 'expo-router'
import messaging from '@react-native-firebase/messaging'
import { getApiClient } from '@caixalertas/api-client'
import type { NotificationData } from '@caixalertas/types'

// Configura cómo se muestran las notificaciones cuando la app está en primer plano
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  })
}

export const registerForPushNotifications = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return null
  if (!Device.isDevice) {
    console.warn('Las notificaciones push solo funcionan en dispositivos físicos')
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    return null
  }

  // Configuración específica de Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('incidents', {
      name: 'Incidencias',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF0000',
      sound: 'notification',
    })

    await Notifications.setNotificationChannelAsync('escalations', {
      name: 'Escalados',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250],
      lightColor: '#FFA500',
    })
  }

  // Firebase Admin necesita un token FCM. React Native Firebase lo obtiene tanto
  // de Android como de iOS, después de registrar el dispositivo para mensajes remotos.
  if (!messaging().isDeviceRegisteredForRemoteMessages) {
    await messaging().registerDeviceForRemoteMessages()
  }

  return messaging().getToken()
}

// Registra el token en el backend
export const registerTokenWithBackend = async (token: string): Promise<void> => {
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web'
  await getApiClient().notifications.registerFcmToken(token, platform)
}

// Navega al deep link de la notificación
export const handleNotificationResponse = (response: Notifications.NotificationResponse): void => {
  const data = response.notification.request.content.data as NotificationData | undefined
  if (!data?.incidentId) return

  const deepLink = data.deepLink ?? `/incidents/${data.incidentId}`
  router.push(deepLink as Parameters<typeof router.push>[0])
}

// Configura los listeners de notificaciones — llamar al montar el root layout
export const setupNotificationListeners = () => {
  if (Platform.OS === 'web') return () => {}

  const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
    // Notificación recibida en primer plano — se muestra automáticamente
    // Aquí puedes actualizar el badge o refrescar datos
    const data = notification.request.content.data as NotificationData | undefined
    if (data?.incidentId) {
      // Invalidar cache de React Query para el incidente
    }
  })

  const responseSub = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse,
  )
  const tokenRefreshUnsubscribe = messaging().onTokenRefresh((token) => {
    void registerTokenWithBackend(token).catch((error) => {
      console.warn('No se ha podido actualizar el token FCM', error)
    })
  })

  return () => {
    foregroundSub.remove()
    responseSub.remove()
    tokenRefreshUnsubscribe()
  }
}
