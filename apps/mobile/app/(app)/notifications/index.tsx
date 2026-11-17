import React from 'react'
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useNotifications, useMarkRead, useMarkAllRead } from '../../../src/hooks/useNotifications'
import type { Notification } from '@caixalertas/types'

export default function NotificationsScreen() {
  const { t } = useTranslation('common')
  const { data, isLoading } = useNotifications()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const notifications = data?.data ?? []

  const handlePress = (notification: Notification) => {
    if (!notification.isRead) {
      markRead.mutate([notification.id])
    }
    if (notification.data?.incidentId) {
      router.push(`/(app)/incidents/${notification.data.incidentId}`)
    }
  }

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      onPress={() => handlePress(item)}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityHint={item.body}
      accessibilityState={{ selected: !item.isRead }}
    >
      {!item.isRead && <View style={styles.unreadDot} accessibilityElementsHidden />}
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, !item.isRead && styles.itemTitleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.itemDate}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Marcar todas como leídas */}
      {notifications.some((n) => !n.isRead) && (
        <TouchableOpacity
          style={styles.markAllBtn}
          onPress={() => markAllRead.mutate()}
          accessibilityRole="button"
          accessibilityLabel={t('actions.seeAll')}
        >
          <Text style={styles.markAllText}>Marcar todas como leídas</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#003087" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <Text style={styles.empty}>{t('status.empty')}</Text>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  markAllBtn: { backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', alignItems: 'flex-end' },
  markAllText: { fontSize: 14, color: '#003087', fontWeight: '500' },
  loader: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  empty: { fontSize: 16, color: '#999', textAlign: 'center' },
  item: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row', gap: 12 },
  itemUnread: { backgroundColor: '#eff6ff' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3182ce', marginTop: 6, flexShrink: 0 },
  itemContent: { flex: 1, gap: 4 },
  itemTitle: { fontSize: 15, color: '#1a202c' },
  itemTitleUnread: { fontWeight: '600' },
  itemBody: { fontSize: 14, color: '#666' },
  itemDate: { fontSize: 12, color: '#999' },
})
