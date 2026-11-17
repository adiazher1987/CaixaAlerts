import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { getApiClient } from '@caixalertas/api-client'
import { useTranslation } from 'react-i18next'
import { format, subDays, startOfMonth } from 'date-fns'
import type { IncidentSeverity } from '@caixalertas/types'

type DateRange = 'last7' | 'last30' | 'thisMonth'

const DATE_RANGES: DateRange[] = ['last7', 'last30', 'thisMonth']

const getDateRange = (range: DateRange) => {
  const to = format(new Date(), 'yyyy-MM-dd')
  switch (range) {
    case 'last7': return { dateFrom: format(subDays(new Date(), 7), 'yyyy-MM-dd'), dateTo: to }
    case 'last30': return { dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'), dateTo: to }
    case 'thisMonth': return { dateFrom: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateTo: to }
  }
}

const SEVERITY_COLOR: Record<IncidentSeverity, string> = {
  P1: '#e53e3e', P2: '#dd6b20', P3: '#d69e2e', P4: '#38a169',
}

export default function ReportsScreen() {
  const { t } = useTranslation('common')
  const [range, setRange] = useState<DateRange>('last7')

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', range],
    queryFn: () => getApiClient().reports.getIncidentReport(getDateRange(range)),
    select: (res) => res.data,
  })

  const report = reportData

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">{t('nav.reports')}</Text>

      {/* Selector de período */}
      <View style={styles.rangeSelector} accessibilityRole="radiogroup">
        {DATE_RANGES.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
            onPress={() => setRange(r)}
            accessibilityRole="radio"
            accessibilityState={{ checked: range === r }}
          >
            <Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>
              {r === 'last7' ? '7 días' : r === 'last30' ? '30 días' : 'Este mes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && <ActivityIndicator size="large" color="#003087" />}

      {report && (
        <>
          {/* Resumen */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumen</Text>
            <View style={styles.kpiGrid}>
              <KpiCard label="Total" value={report.summary.total} color="#3182ce" />
              <KpiCard label="SLA incumplido" value={report.summary.slaBreached} color="#e53e3e" />
              <KpiCard
                label="MTTR (min)"
                value={Math.round(report.summary.avgResolutionTimeMinutes)}
                color="#805ad5"
              />
            </View>
          </View>

          {/* Por severidad */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Por severidad</Text>
            {(Object.entries(report.summary.bySeverity) as [IncidentSeverity, number][]).map(([sev, count]) => (
              <View key={sev} style={styles.severityRow}>
                <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLOR[sev] }]} />
                <Text style={styles.severityLabel}>{t(`severity.${sev}`)}</Text>
                <Text style={styles.severityCount}>{count}</Text>
              </View>
            ))}
          </View>

          {/* Por grupo */}
          {report.byGroup.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Por grupo</Text>
              {report.byGroup.map((g) => (
                <View key={g.groupId} style={styles.groupRow}>
                  <Text style={styles.groupCode}>{g.groupCode}</Text>
                  <Text style={styles.groupName}>{g.groupName}</Text>
                  <Text style={styles.groupCount}>{g.total}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  )
}

const KpiCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <View
    style={[styles.kpiCard, { borderTopColor: color }]}
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
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#003087' },
  rangeSelector: { flexDirection: 'row', gap: 8 },
  rangeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  rangeBtnActive: { backgroundColor: '#003087', borderColor: '#003087' },
  rangeBtnText: { fontSize: 13, color: '#666' },
  rangeBtnTextActive: { color: '#fff', fontWeight: '600' },
  section: { backgroundColor: '#fff', borderRadius: 8, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiGrid: { flexDirection: 'row', gap: 12 },
  kpiCard: { flex: 1, borderTopWidth: 3, paddingTop: 8, gap: 2 },
  kpiValue: { fontSize: 28, fontWeight: 'bold' },
  kpiLabel: { fontSize: 12, color: '#666' },
  severityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  severityDot: { width: 10, height: 10, borderRadius: 5 },
  severityLabel: { flex: 1, fontSize: 14, color: '#333' },
  severityCount: { fontSize: 16, fontWeight: 'bold', color: '#1a202c' },
  groupRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  groupCode: { width: 40, fontSize: 14, fontWeight: '600', color: '#003087' },
  groupName: { flex: 1, fontSize: 14, color: '#333' },
  groupCount: { fontSize: 16, fontWeight: 'bold', color: '#1a202c' },
})
