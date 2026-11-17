import Constants from 'expo-constants'

interface AppExtra {
  appEnv: 'development' | 'staging' | 'production'
  apiUrl: string
}

const extra = Constants.expoConfig?.extra as AppExtra

export const ENV = {
  appEnv: extra?.appEnv ?? 'development',
  apiUrl: extra?.apiUrl ?? 'http://localhost:3000/api/v1',
  isDev: extra?.appEnv === 'development',
  isProd: extra?.appEnv === 'production',
}
