import React, { useState } from 'react'
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  TextInput,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  useIncident,
  useAcknowledge,
  useEscalate,
  useResolve,
} from '../../../src/hooks/useIncidents'
import { useAuthStore } from '../../../src/stores/auth.store'
import { useEstructura } from '../../../src/hooks/useEstructura'
import type { EscalationLevel, NodoEstructura } from '@caixalertas/types'

type EscalationAction = 'escalate' | 'derive' | null
type EscalationOption = { level: EscalationLevel; node: NodoEstructura }

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t } = useTranslation('incidents')
  const { t: tc } = useTranslation('common')
  const { user } = useAuthStore()
  const [escalationAction, setEscalationAction] = useState<EscalationAction>(null)
  const [selectedLevel, setSelectedLevel] = useState<EscalationLevel>(2)
  const [targetGroupId, setTargetGroupId] = useState('')
  const [escalationReason, setEscalationReason] = useState('')
  const [escalationError, setEscalationError] = useState<string | null>(null)

  const { data: incident, isLoading } = useIncident(id ?? '')
  const { data: nodos = [] } = useEstructura()
  const acknowledge = useAcknowledge()
  const escalate = useEscalate()
  const resolve = useResolve()

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#003087" />
      </View>
    )
  }

  if (!incident) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{tc('status.error')}</Text>
      </View>
    )
  }

  const nodesById = new Map(nodos.map((nodo) => [nodo.id, nodo]))
  const levels: EscalationOption[] = []
  const visitedNodeIds = new Set<string>([incident.originGroupId])
  let parentId = nodesById.get(incident.originGroupId)?.parentId

  while (parentId && !visitedNodeIds.has(parentId) && levels.length < 5) {
    const parent = nodesById.get(parentId)
    if (!parent) break
    visitedNodeIds.add(parent.id)
    levels.push({ level: (levels.length + 2) as EscalationLevel, node: parent })
    parentId = parent.parentId
  }

  const availableLevels = levels.filter((item) => item.level > incident.currentEscalationLevel)
  const canAck = incident.status === 'open' && user?.role !== 'readonly'
  const canEscalate =
    ['open', 'acknowledged', 'in_progress', 'escalated'].includes(incident.status) &&
    availableLevels.length > 0 &&
    user?.role !== 'readonly'
  const canResolve =
    incident.status !== 'resolved' && incident.status !== 'closed' && user?.role !== 'readonly'

  const handleAck = () => {
    acknowledge.mutate({ incidentId: incident.id })
  }

  const nextLevel = availableLevels[0]?.level
  const guardias = nodos.filter(
    (nodo) => nodo.tipo === 'guardia' && !incident.involvedGroupIds.includes(nodo.id),
  )

  const openEscalation = (action: Exclude<EscalationAction, null>) => {
    if (!nextLevel) return
    setEscalationAction(action)
    setSelectedLevel(nextLevel)
    setTargetGroupId('')
    setEscalationReason('')
    setEscalationError(null)
  }

  const closeEscalation = () => {
    if (!escalate.isPending) setEscalationAction(null)
  }

  const submitEscalation = () => {
    if (!escalationAction) return
    if (escalationReason.trim().length < 5) {
      setEscalationError('Indica un motivo de al menos 5 caracteres')
      return
    }
    if (escalationAction === 'derive' && !targetGroupId) {
      setEscalationError('Selecciona la guardia de destino')
      return
    }

    setEscalationError(null)
    escalate.mutate(
      {
        incidentId: incident.id,
        targetLevel: selectedLevel,
        reason: escalationReason.trim(),
        ...(escalationAction === 'derive' ? { targetGroupId } : {}),
      },
      { onSuccess: () => setEscalationAction(null) },
    )
  }

  const handleResolve = () => {
    Alert.prompt(t('resolve.title'), t('resolve.summaryPlaceholder'), (summary) => {
      if (!summary) return
      resolve.mutate({ incidentId: incident.id, resolutionSummary: summary })
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard} accessible accessibilityRole="header">
        <View style={styles.badgeRow}>
          <View
            style={[styles.badge, { backgroundColor: SEVERITY_COLOR[incident.severity] ?? '#999' }]}
          >
            <Text style={styles.badgeText}>{incident.severity}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#eee' }]}>
            <Text style={[styles.badgeText, { color: '#333' }]}>
              {t(`status.${incident.status}`)}
            </Text>
          </View>
          {incident.slaBreached && (
            <View style={[styles.badge, { backgroundColor: '#fff3cd' }]}>
              <Text style={[styles.badgeText, { color: '#92400e' }]}>SLA ⚠️</Text>
            </View>
          )}
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {incident.title}
        </Text>
        {incident.application && (
          <Text style={styles.app}>
            {t('detail.application')}: {incident.application}
          </Text>
        )}
        <Text style={styles.date}>{new Date(incident.createdAt).toLocaleString()}</Text>
      </View>

      {/* Descripción */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('detail.resolution')}</Text>
        <Text style={styles.description}>{incident.description}</Text>
      </View>

      {/* Llamante */}
      {incident.externalCallerId && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('detail.caller')}</Text>
          <Text style={styles.bodyText}>{incident.externalCallerId}</Text>
          {incident.externalCallerPhone && (
            <Text style={styles.bodyText}>{incident.externalCallerPhone}</Text>
          )}
        </View>
      )}

      {/* Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('detail.timeline')}</Text>
        {incident.timeline.map((event) => (
          <View key={event.id} style={styles.timelineEvent}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineMessage}>{event.message}</Text>
              <Text style={styles.timelineDate}>{new Date(event.createdAt).toLocaleString()}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Acciones */}
      {user?.role !== 'readonly' && (
        <View style={styles.actions}>
          {canAck && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.ackBtn]}
              onPress={handleAck}
              disabled={acknowledge.isPending}
              accessibilityRole="button"
              accessibilityLabel={t('actions.acknowledge')}
            >
              <Text style={styles.actionBtnText}>{t('actions.acknowledgeShort')}</Text>
            </TouchableOpacity>
          )}
          {canEscalate && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.escalateBtn]}
              onPress={() => openEscalation('escalate')}
              disabled={escalate.isPending}
              accessibilityRole="button"
              accessibilityLabel={t('actions.escalate')}
            >
              <Text style={styles.actionBtnText}>{t('actions.escalate')}</Text>
            </TouchableOpacity>
          )}
          {canEscalate && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.deriveBtn]}
              onPress={() => openEscalation('derive')}
              disabled={escalate.isPending}
              accessibilityRole="button"
              accessibilityLabel="Derivar a otra guardia"
            >
              <Text style={styles.actionBtnText}>Derivar a otra guardia</Text>
            </TouchableOpacity>
          )}
          {canResolve && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.resolveBtn]}
              onPress={handleResolve}
              disabled={resolve.isPending}
              accessibilityRole="button"
              accessibilityLabel={t('actions.resolve')}
            >
              <Text style={styles.actionBtnText}>{t('actions.resolve')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal
        visible={escalationAction !== null}
        transparent
        animationType="slide"
        onRequestClose={closeEscalation}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {escalationAction === 'derive' ? 'Derivar a otra guardia' : 'Escalar incidencia'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Estos niveles se obtienen de la jerarquía configurada para la guardia de origen.
            </Text>

            <Text style={styles.modalLabel}>Nivel de escalado</Text>
            <View style={styles.levelOptions}>
              {availableLevels.map((item) => {
                const selected = item.level === selectedLevel
                return (
                  <TouchableOpacity
                    key={item.level}
                    style={[styles.levelOption, selected && styles.levelOptionSelected]}
                    onPress={() => setSelectedLevel(item.level)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[styles.levelOptionText, selected && styles.levelOptionTextSelected]}
                    >
                      Nivel {item.level} · {item.node.nombre}
                    </Text>
                    <Text style={styles.levelOptionType}>{item.node.tipo}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {escalationAction === 'derive' && (
              <>
                <Text style={styles.modalLabel}>Guardia de destino</Text>
                {guardias.length === 0 ? (
                  <Text style={styles.modalHelp}>
                    No hay otra guardia disponible para derivar esta incidencia.
                  </Text>
                ) : (
                  <View style={styles.groupOptions}>
                    {guardias.map((guardia) => {
                      const selected = guardia.id === targetGroupId
                      return (
                        <TouchableOpacity
                          key={guardia.id}
                          style={[styles.groupOption, selected && styles.groupOptionSelected]}
                          onPress={() => setTargetGroupId(guardia.id)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                        >
                          <Text
                            style={[
                              styles.groupOptionText,
                              selected && styles.groupOptionTextSelected,
                            ]}
                          >
                            {guardia.nombre}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}
              </>
            )}

            <Text style={styles.modalLabel}>Motivo</Text>
            <TextInput
              style={styles.reasonInput}
              value={escalationReason}
              onChangeText={setEscalationReason}
              placeholder="Explica por qué se escala o deriva"
              multiline
              textAlignVertical="top"
              maxLength={500}
              accessibilityLabel="Motivo de escalado"
            />
            {escalationError && <Text style={styles.modalError}>{escalationError}</Text>}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeEscalation}
                disabled={escalate.isPending}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, escalate.isPending && styles.confirmButtonDisabled]}
                onPress={submitEscalation}
                disabled={
                  escalate.isPending || (escalationAction === 'derive' && guardias.length === 0)
                }
              >
                {escalate.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const SEVERITY_COLOR: Record<string, string> = {
  P1: '#e53e3e',
  P2: '#dd6b20',
  P3: '#d69e2e',
  P4: '#38a169',
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#e53e3e' },
  headerCard: { backgroundColor: '#fff', borderRadius: 8, padding: 16, gap: 8 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a202c' },
  app: { fontSize: 14, color: '#666' },
  date: { fontSize: 12, color: '#999' },
  section: { backgroundColor: '#fff', borderRadius: 8, padding: 16, gap: 8 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: { fontSize: 15, color: '#333', lineHeight: 22 },
  bodyText: { fontSize: 14, color: '#333' },
  timelineEvent: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#003087', marginTop: 6 },
  timelineContent: { flex: 1, gap: 2 },
  timelineMessage: { fontSize: 14, color: '#333' },
  timelineDate: { fontSize: 11, color: '#999' },
  actions: { gap: 12 },
  actionBtn: { borderRadius: 8, paddingVertical: 14, alignItems: 'center', minHeight: 48 },
  ackBtn: { backgroundColor: '#3182ce' },
  escalateBtn: { backgroundColor: '#805ad5' },
  deriveBtn: { backgroundColor: '#0f766e' },
  resolveBtn: { backgroundColor: '#38a169' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard: {
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    gap: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1a202c' },
  modalSubtitle: { color: '#4a5568', fontSize: 14, lineHeight: 20 },
  modalLabel: { color: '#1a202c', fontSize: 14, fontWeight: '700', marginTop: 4 },
  levelOptions: { gap: 8 },
  levelOption: { borderWidth: 1, borderColor: '#cbd5e0', borderRadius: 8, padding: 11 },
  levelOptionSelected: { borderColor: '#805ad5', backgroundColor: '#f3e8ff' },
  levelOptionText: { color: '#4a5568', fontSize: 14 },
  levelOptionTextSelected: { color: '#6b21a8', fontWeight: '700' },
  levelOptionType: {
    color: '#718096',
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  groupOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  groupOption: {
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  groupOptionSelected: { borderColor: '#0f766e', backgroundColor: '#ccfbf1' },
  groupOptionText: { color: '#4a5568', fontSize: 14 },
  groupOptionTextSelected: { color: '#115e59', fontWeight: '700' },
  modalHelp: { color: '#718096', fontSize: 14, lineHeight: 20 },
  reasonInput: {
    minHeight: 94,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 8,
    padding: 12,
    color: '#1a202c',
    fontSize: 15,
  },
  modalError: { color: '#c53030', fontSize: 14 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelButton: { paddingHorizontal: 16, paddingVertical: 12 },
  cancelButtonText: { color: '#4a5568', fontWeight: '600' },
  confirmButton: {
    minWidth: 112,
    backgroundColor: '#003087',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmButtonText: { color: '#fff', fontWeight: '700' },
})
