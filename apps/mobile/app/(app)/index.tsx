import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../src/stores/auth.store'
import { useIncidents } from '../../src/hooks/useIncidents'
import type { IncidentStatus } from '@caixalertas/types'

export default function DashboardScreen() {
  const { t } = useTranslation('common')
  const { user } = useAuthStore()
  const { data: activeData } = useIncidents({
    status: ['open', 'acknowledged', 'in_progress', 'escalated'] as IncidentStatus[],
    limit: 100,
  })

  const activeIncidents = activeData?.data ?? []
  const p1Count = activeIncidents.filter((i) => i.severity === 'P1').length
  const p2Count = activeIncidents.filter((i) => i.severity === 'P2').length
  const slaBreachedCount = activeIncidents.filter((i) => i.slaBreached).length

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting} accessibilityRole="header">
        {t('app.name')}
      </Text>
      <Text style={styles.subtitle}>
        {user?.name} · {t(`roles.${user?.role}`)}
      </Text>

      {/* KPIs */}
      <View style={styles.kpiGrid} accessibilityRole="summary">
        <KpiCard
          label="Incidencias activas"
          value={activeIncidents.length}
          color="#3182ce"
        />
        <KpiCard label="P1 Críticas" value={p1Count} color="#e53e3e" />
        <KpiCard label="P2 Altas" value={p2Count} color="#dd6b20" />
        <KpiCard label="SLA en riesgo" value={slaBreachedCount} color="#d69e2e" />
      </View>
    </ScrollView>
  )
}

const KpiCard = ({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) => (
  <View
    style={[styles.kpiCard, { borderLeftColor: color }]}
    accessible
    accessibilityRole="text"
    accessibilityLabel={`${label}: ${value}`}
  >
    <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
  </View>
)

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, gap: 16 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#003087' },
  subtitle: { fontSize: 14, color: '#666' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#fff',
    borderRadius: 8, padding: 16, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  kpiValue: { fontSize: 32, fontWeight: 'bold' },
  kpiLabel: { fontSize: 13, color: '#666', marginTop: 4 },
})
