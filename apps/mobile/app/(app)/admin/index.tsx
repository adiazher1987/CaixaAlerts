import React from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import type { UserPublic } from '@caixalertas/types'
import { useUsers, useDeactivateUser } from '../../../src/hooks/useUsers'

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Superadmin',
  responsable_cliente: 'Responsable Cliente',
  responsable_grupo: 'Responsable Grupo',
  responsable_guardia: 'Responsable Guardia',
  miembro_guardia: 'Miembro Guardia',
  readonly: 'Solo Lectura',
}

export default function AdminUsersScreen() {
  const { data: users = [], isLoading, refetch, isRefetching } = useUsers()
  const deactivate = useDeactivateUser()

  const confirmDeactivate = (user: UserPublic) => {
    Alert.alert(
      'Desactivar usuario',
      `¿Desactivar a ${user.name}? Perderá el acceso a la aplicación.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: () => deactivate.mutate(user.id),
        },
      ],
    )
  }

  const renderItem = ({ item }: { item: UserPublic }) => (
    <View style={[styles.card, !item.isActive && styles.cardInactive]}>
      <TouchableOpacity
        style={styles.cardBody}
        onPress={() => router.push(`/(app)/admin/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Editar ${item.name}`}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
          <View style={styles.badges}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{ROLE_LABEL[item.role] ?? item.role}</Text>
            </View>
            {!item.isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inactivo</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
      {item.isActive && (
        <TouchableOpacity
          onPress={() => confirmDeactivate(item)}
          style={styles.deactivateBtn}
          accessibilityRole="button"
          accessibilityLabel={`Desactivar ${item.name}`}
        >
          <Text style={styles.deactivateBtnText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#003087" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          contentContainerStyle={users.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No hay usuarios registrados</Text>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/admin/new')}
        accessibilityRole="button"
        accessibilityLabel="Crear usuario"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loader: { flex: 1 },
  list: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  empty: { fontSize: 16, color: '#999', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 8, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  cardInactive: { opacity: 0.5 },
  cardBody: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#003087', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: '600', color: '#1a202c' },
  email: { fontSize: 13, color: '#666' },
  badges: { flexDirection: 'row', gap: 6, marginTop: 2 },
  roleBadge: { backgroundColor: '#ebf4ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  roleBadgeText: { fontSize: 12, color: '#003087', fontWeight: '500' },
  inactiveBadge: { backgroundColor: '#fee', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  inactiveBadgeText: { fontSize: 12, color: '#e53e3e' },
  deactivateBtn: { padding: 16 },
  deactivateBtnText: { fontSize: 18, color: '#e53e3e' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#003087', alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
})
