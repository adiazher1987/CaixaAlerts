import { useState, useEffect } from 'react'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { useTranslation } from 'react-i18next'

const BIOMETRIC_CREDENTIALS_KEY = 'ca_biometric_credentials'

interface BiometricCredentials {
  email: string
  password: string
}

interface UseBiometricsReturn {
  isAvailable: boolean
  isEnrolled: boolean
  biometricType: 'fingerprint' | 'facial' | 'iris' | null
  authenticate: () => Promise<boolean>
  saveCredentials: (email: string, password: string) => Promise<void>
  getCredentials: () => Promise<BiometricCredentials | null>
  clearCredentials: () => Promise<void>
  isEnabled: boolean
}

export const useBiometrics = (): UseBiometricsReturn => {
  const { t } = useTranslation('auth')
  const [isAvailable, setIsAvailable] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'facial' | 'iris' | null>(null)
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    void checkBiometrics()
  }, [])

  const checkBiometrics = async () => {
    const hardware = await LocalAuthentication.hasHardwareAsync()
    const enrolled = await LocalAuthentication.isEnrolledAsync()
    setIsAvailable(hardware)
    setIsEnrolled(enrolled)

    if (hardware && enrolled) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('facial')
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('fingerprint')
      } else {
        setBiometricType('iris')
      }
    }

    // Comprueba si el usuario tiene credenciales guardadas
    const stored = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY)
    setIsEnabled(!!stored)
  }

  const authenticate = async (): Promise<boolean> => {
    if (!isAvailable || !isEnrolled) return false

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t('login.biometricPrompt'),
      cancelLabel: t('actions.cancel', { ns: 'common' }),
      disableDeviceFallback: false,
    })

    return result.success
  }

  const saveCredentials = async (email: string, password: string): Promise<void> => {
    const credentials: BiometricCredentials = { email, password }
    await SecureStore.setItemAsync(
      BIOMETRIC_CREDENTIALS_KEY,
      JSON.stringify(credentials),
      { requireAuthentication: true },  // Solo accesible tras autenticación biométrica
    )
    setIsEnabled(true)
  }

  const getCredentials = async (): Promise<BiometricCredentials | null> => {
    const stored = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY, {
      requireAuthentication: true,
    })
    if (!stored) return null
    return JSON.parse(stored) as BiometricCredentials
  }

  const clearCredentials = async (): Promise<void> => {
    await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY)
    setIsEnabled(false)
  }

  return {
    isAvailable,
    isEnrolled,
    biometricType,
    authenticate,
    saveCredentials,
    getCredentials,
    clearCredentials,
    isEnabled,
  }
}
