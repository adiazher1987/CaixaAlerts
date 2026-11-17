import React, { useState } from 'react'
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useIncidents } from '../../../src/hooks/useIncidents'
import type { Incident, IncidentStatus } from '@caixalertas/types'

const SEVERITY_COLOR: Record<string, string> = {
  P1: '#e53e3e',
  P2: '#dd6b20',
  P3: '#d69e2e',
  P4: '#38a169',
}

const STATUS_COLOR: Record<IncidentStatus, string> = {
  open: '#e53e3e',
  acknowledged: '#d69e2e',
  in_progress: '#3182ce',
  escalated: '#805ad5',
  resolved: '#38a169',
  closed: '#718096',
}

export default function IncidentsScreen() {
  const { t } = useTranslation('incidents')
  const [showActive, setShowActive] = useState(true)

  const filters = showActive
    ? { status: ['open', 'acknowledged', 'in_progress', 'escalated'] as IncidentStatus[] }
    : undefined

  const { data, isLoading, refetch, isRefetching } = useIncidents(filters)

  const renderItem = ({ item }: { item: Incident }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(app)/incidents/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Incidencia ${item.severity}: ${item.title}`}
      accessibilityHint="Toca para ver los detalles"
    >
      <View style={styles.cardHeader}>
        <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLOR[item.severity] ?? '#999' }]}>
          <Text style={styles.severityText}>{item.severity}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] ?? '#999' }]}>
          <Text style={styles.statusText}>{t(`status.${item.status}`)}</Text>
        </View>
        {item.slaBreached && (
          <View style={styles.slaBreach}>
            <Text style={styles.slaBreachText}>SLA ⚠️</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>

      {item.application && (
        <Text style={styles.cardApp}>{item.application}</Text>
      )}

      <Text style={styles.cardDate}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Filtro activas / todas */}
      <View style={styles.filterRow} accessibilityRole="tablist">
        <TouchableOpacity
          style={[styles.filterTab, showActive && styles.filterTabActive]}
          onPress={() => setShowActive(true)}
          accessibilityRole="tab"
          accessibilityState={{ selected: showActive }}
        >
          <Text style={[styles.filterTabText, showActive && styles.filterTabTextActive]}>
            {t('list.active')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, !showActive && styles.filterTabActive]}
          onPress={() => setShowActive(false)}
          accessibilityRole="tab"
          accessibilityState={{ selected: !showActive }}
        >
          <Text style={[styles.filterTabText, !showActive && styles.filterTabTextActive]}>
            {t('list.all')}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#003087" />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          contentContainerStyle={data?.data.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <Text style={styles.empty} accessibilityRole="text">
              {t('list.empty')}
            </Text>
          }
        />
      )}

      {/* FAB: crear incidencia */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/incidents/create')}
        accessibilityRole="button"
        accessibilityLabel={t('create.title')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  filterRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  filterTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  filterTabActive: { borderBottomWidth: 2, borderBottomColor: '#003087' },
  filterTabText: { fontSize: 14, color: '#666' },
  filterTabTextActive: { color: '#003087', fontWeight: '600' },
  loader: { flex: 1 },
  list: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  empty: { fontSize: 16, color: '#999', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 8, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  severityText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: 12 },
  slaBreach: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: '#fff3cd', borderWidth: 1, borderColor: '#d69e2e' },
  slaBreachText: { fontSize: 12, color: '#92400e' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1a202c' },
  cardApp: { fontSize: 13, color: '#666' },
  cardDate: { fontSize: 12, color: '#999' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#003087', alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
})
