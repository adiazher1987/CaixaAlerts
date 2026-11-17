import React, { useRef } from 'react'
import { Tabs, Redirect, router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native'
import { useAuthStore } from '../../src/stores/auth.store'
import { useUnreadCount } from '../../src/hooks/useNotifications'

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { t } = useTranslation('common')
  const isAdmin = user?.role === 'superadmin' || user?.role === 'responsable_grupo'

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />

  const logoutRef = useRef(logout)
  logoutRef.current = logout

  const doLogout = async () => {
    await logoutRef.current()
    if (Platform.OS === 'web') {
      window.location.replace('/')
    } else {
      router.replace('/(auth)/login')
    }
  }

  const handleLogoutRef = useRef(() => {})
  handleLogoutRef.current = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Seguro que quieres cerrar sesión?')) void doLogout()
      return
    }
    const { Alert } = require('react-native')
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => void doLogout() },
    ])
  }

  const HeaderRight = () => (
    <View style={headerStyles.row}>
      {isAdmin && (
        <>
          <TouchableOpacity
            onPress={() => router.push('/(app)/admin')}
            style={headerStyles.btn}
            accessibilityRole="button"
            accessibilityLabel="Usuarios"
          >
            <Text style={headerStyles.btnText}>👥 Usuarios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(app)/estructura')}
            style={headerStyles.btn}
            accessibilityRole="button"
            accessibilityLabel="Agrupación Alertas"
          >
            <Text style={headerStyles.btnText}>🛡️ Agrupación Alertas</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity
        onPress={() => handleLogoutRef.current()}
        style={headerStyles.btn}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
      >
        <Text style={headerStyles.btnText}>Salir</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#003087',
        tabBarInactiveTintColor: '#999',
        headerStyle: { backgroundColor: '#003087' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerRight: () => <HeaderRight />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.dashboard'),
          tabBarIcon: ({ color }) => <TabIcon label="📊" color={color} />,
        }}
      />
      <Tabs.Screen
        name="incidents/index"
        options={{
          title: t('nav.incidents'),
          tabBarIcon: ({ color }) => <TabIcon label="🚨" color={color} />,
          headerTitle: t('nav.incidents'),
        }}
      />
      <Tabs.Screen name="incidents/create" options={{ href: null, title: 'Nueva incidencia' }} />
      <Tabs.Screen
        name="notifications/index"
        options={{
          title: t('nav.notifications'),
          tabBarIcon: ({ color }) => <NotificationTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports/index"
        options={{
          title: t('nav.reports'),
          tabBarIcon: ({ color }) => <TabIcon label="📈" color={color} />,
        }}
      />
      {/* Pantallas de admin y estructura: accesibles desde header, no como tabs */}
      <Tabs.Screen name="admin" options={{ href: null }} />
      <Tabs.Screen name="estructura" options={{ href: null }} />
    </Tabs>
  )
}

const headerStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingRight: 8, gap: 4 },
  btn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)' },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
})

const TabIcon = ({ label, color }: { label: string; color: string }) => (
  <Text style={{ fontSize: 20, color }}>{label}</Text>
)

const NotificationTabIcon = ({ color }: { color: string }) => {
  const { data: count = 0 } = useUnreadCount()
  return (
    <View>
      <Text style={{ fontSize: 20, color }}>🔔</Text>
      {count > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -8,
          backgroundColor: '#e53e3e', borderRadius: 8,
          minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
    </View>
  )
}
