import type { ExpoConfig, ConfigContext } from 'expo/config'

const APP_ENV = process.env['APP_ENV'] ?? 'development'

const envConfig =
  {
    development: {
      name: 'CaixAlertas (Dev)',
      bundleId: 'com.nttdata.caixalertas.dev',
      apiUrl: 'http://localhost:3000/api/v1',
      icon: './assets/icon-dev.png',
    },
    staging: {
      name: 'CaixAlertas (Staging)',
      bundleId: 'com.nttdata.caixalertas.staging',
      apiUrl: 'https://api-staging.caixalertas.internal/api/v1',
      icon: './assets/icon-staging.png',
    },
    production: {
      name: 'CaixAlertas',
      bundleId: 'com.nttdata.caixalertas',
      apiUrl: 'https://api.caixalertas.internal/api/v1',
      icon: './assets/icon.png',
    },
  }[APP_ENV] ?? envConfig['development']

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: envConfig.name,
  slug: 'caixalertas',
  version: '1.0.0',
  orientation: 'portrait',
  icon: envConfig.icon,
  scheme: 'caixalertas', // Deep links: caixalertas://
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#003087', // NTT Data blue
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: envConfig.bundleId,
    googleServicesFile: './GoogleService-Info.plist',
    infoPlist: {
      NSFaceIDUsageDescription: 'Usa Face ID para acceder a CaixAlertas de forma segura.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#003087',
    },
    package: envConfig.bundleId,
    permissions: [
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.VIBRATE',
    ],
    googleServicesFile: './google-services.json',
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    ['expo-router', { root: './app' }],
    'expo-font',
    'expo-localization',
    'expo-secure-store',
    ['expo-local-authentication', { faceIDPermission: 'Usa Face ID para acceder a CaixAlertas.' }],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#003087',
        sounds: ['./assets/notification.wav'],
      },
    ],
    '@react-native-firebase/app',
    '@react-native-firebase/messaging',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'dynamic',
        },
      },
    ],
    ['expo-updates', { username: 'nttdata' }],
  ],
  extra: {
    appEnv: APP_ENV,
    apiUrl: envConfig.apiUrl,
  },
})
