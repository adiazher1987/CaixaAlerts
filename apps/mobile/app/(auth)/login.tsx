import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../../src/stores/auth.store'
import { useBiometrics } from '../../src/hooks/useBiometrics'
import {
  registerForPushNotifications,
  registerTokenWithBackend,
} from '../../src/services/notifications.service'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
type LoginForm = z.infer<typeof loginSchema>

export default function LoginScreen() {
  const { t } = useTranslation('auth')
  const { login } = useAuthStore()
  const { isAvailable, isEnrolled, isEnabled, biometricType, getCredentials, saveCredentials } =
    useBiometrics()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  // Intenta login biométrico automáticamente al abrir si está configurado
  useEffect(() => {
    if (isAvailable && isEnrolled && isEnabled) {
      void handleBiometricLogin()
    }
  }, [isAvailable, isEnrolled, isEnabled])

  const handleBiometricLogin = async () => {
    const credentials = await getCredentials()
    if (!credentials) return
    await performLogin(credentials.email, credentials.password)
  }

  const performLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      let fcmToken: string | null = null
      try {
        fcmToken = await registerForPushNotifications()
      } catch (pushError) {
        console.warn('No se ha podido registrar el dispositivo para push', pushError)
      }
      await login(email, password, fcmToken ?? undefined)
      if (fcmToken) {
        await registerTokenWithBackend(fcmToken).catch((pushError) => {
          console.warn('No se ha podido guardar el token push', pushError)
        })
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string }
      setErrorMsg(apiErr?.message ?? 'Credenciales incorrectas')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = (data: LoginForm) => void performLogin(data.email, data.password)

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner} accessibilityRole="none">
        {/* Logo / Header */}
        <View style={styles.header} accessible accessibilityRole="header">
          <Text style={styles.appName} accessibilityRole="text">
            CaixAlertas
          </Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={styles.fieldGroup}>
                <Text style={styles.label} accessibilityRole="text">
                  {t('login.email')}
                </Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="usuario@nttdata.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  accessibilityLabel={t('login.email')}
                  accessibilityHint={t('validation.emailInvalid')}
                />
                {errors.email && (
                  <Text style={styles.error} accessibilityRole="alert">
                    {t('validation.emailInvalid')}
                  </Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('login.password')}</Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="current-password"
                  textContentType="password"
                  accessibilityLabel={t('login.password')}
                />
                {errors.password && (
                  <Text style={styles.error} accessibilityRole="alert">
                    {t('validation.passwordRequired')}
                  </Text>
                )}
              </View>
            )}
          />

          {errorMsg && (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={t('login.submit')}
            accessibilityState={{ disabled: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('login.submit')}</Text>
            )}
          </TouchableOpacity>

          {/* Botón biométrico */}
          {isAvailable && isEnrolled && isEnabled && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              accessibilityRole="button"
              accessibilityLabel={t('login.biometric')}
            >
              <Text style={styles.biometricText}>
                {biometricType === 'facial' ? '👤' : '👆'} {t('login.biometric')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  appName: { fontSize: 32, fontWeight: 'bold', color: '#003087', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
  form: { gap: 16 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500', color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  inputError: { borderColor: '#e53e3e' },
  error: { fontSize: 12, color: '#e53e3e' },
  errorBanner: {
    backgroundColor: '#fff5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#e53e3e',
    padding: 12,
    borderRadius: 4,
  },
  errorBannerText: { color: '#c53030', fontSize: 14 },
  button: {
    backgroundColor: '#003087',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  biometricButton: {
    borderWidth: 1,
    borderColor: '#003087',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 48,
  },
  biometricText: { color: '#003087', fontSize: 16 },
})
