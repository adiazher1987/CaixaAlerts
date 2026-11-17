import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { router } from 'expo-router'
import type { IncidentSeverity, NodoEstructura } from '@caixalertas/types'
import { useEstructura } from '../../../src/hooks/useEstructura'
import { useCreateIncident } from '../../../src/hooks/useIncidents'
import { useAuthStore } from '../../../src/stores/auth.store'

const SEVERITIES: Array<{
  value: IncidentSeverity
  label: string
  description: string
  color: string
}> = [
  { value: 'P1', label: 'P1 · Crítica', description: 'SLA de 4 horas', color: '#c53030' },
  { value: 'P2', label: 'P2 · Alta', description: 'SLA de 8 horas', color: '#c05621' },
  { value: 'P3', label: 'P3 · Media', description: 'SLA de 24 horas', color: '#b7791f' },
  { value: 'P4', label: 'P4 · Baja', description: 'SLA de 72 horas', color: '#2f855a' },
]

const getErrorMessage = (error: unknown) =>
  (error as { message?: string })?.message ?? 'No se ha podido crear la incidencia'

export default function CreateIncidentScreen() {
  const { data: nodos = [], isLoading: isLoadingEstructura } = useEstructura()
  const createIncident = useCreateIncident()
  const user = useAuthStore((state) => state.user)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [application, setApplication] = useState('')
  const [severity, setSeverity] = useState<IncidentSeverity>('P3')
  const [guardiaId, setGuardiaId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const guardias = useMemo(() => {
    const isCoordinator = ['superadmin', 'responsable_cliente', 'responsable_grupo'].includes(
      user?.role ?? '',
    )
    return nodos.filter((nodo) => {
      if (nodo.tipo !== 'guardia') return false
      if (isCoordinator) return true
      return (
        nodo.id === user?.groupId ||
        (nodo.miembros ?? []).includes(user?.id ?? '') ||
        (nodo.responsables ?? []).includes(user?.id ?? '')
      )
    })
  }, [nodos, user?.id, user?.role])
  const guardia = guardias.find((nodo) => nodo.id === guardiaId) as NodoEstructura | undefined
  const applications = guardia?.aplicaciones ?? []

  const selectGuardia = (id: string) => {
    setGuardiaId(id)
    setApplication('')
  }

  const onSubmit = async () => {
    if (title.trim().length < 5) {
      setError('Escribe un resumen de al menos 5 caracteres')
      return
    }
    if (!guardiaId) {
      setError('Selecciona la guardia que debe recibir la incidencia')
      return
    }
    if (!application.trim()) {
      setError('Indica la aplicación afectada')
      return
    }
    if (description.trim().length < 10) {
      setError('Explica el motivo con al menos 10 caracteres')
      return
    }

    setError(null)
    try {
      const response = await createIncident.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        application: application.trim(),
        severity,
        originGroupId: guardiaId,
      })
      const id = response.data?.id
      if (id) {
        router.replace(`/(app)/incidents/${id}`)
      } else {
        router.replace('/(app)/incidents')
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.cancel}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva incidencia</Text>
        <TouchableOpacity
          onPress={onSubmit}
          disabled={createIncident.isPending}
          accessibilityRole="button"
        >
          {createIncident.isPending ? (
            <ActivityIndicator color="#003087" />
          ) : (
            <Text style={styles.save}>Crear</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Indica los datos básicos. La auditoría, el estado inicial y el plazo SLA se generan
          automáticamente.
        </Text>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.label}>Resumen</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ej. No se puede acceder al portal"
          maxLength={200}
          accessibilityLabel="Resumen de la incidencia"
        />

        <Text style={styles.label}>Guardia responsable</Text>
        {isLoadingEstructura ? (
          <ActivityIndicator color="#003087" />
        ) : guardias.length === 0 ? (
          <Text style={styles.help}>
            No hay guardias configuradas. Crea una desde Estructura antes de registrar la
            incidencia.
          </Text>
        ) : (
          <View style={styles.options}>
            {guardias.map((item) => {
              const selected = item.id === guardiaId
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => selectGuardia(item.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {item.nombre}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        <Text style={styles.label}>Aplicación afectada</Text>
        {applications.length > 0 && (
          <View style={styles.options}>
            {applications.map((item) => {
              const selected = item.nombre === application
              return (
                <TouchableOpacity
                  key={`${item.idCliente}-${item.nombre}`}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => setApplication(item.nombre)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {item.nombre}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
        <TextInput
          style={styles.input}
          value={application}
          onChangeText={setApplication}
          placeholder={
            applications.length > 0 ? 'O escribe otra aplicación' : 'Nombre de la aplicación'
          }
          maxLength={100}
          accessibilityLabel="Aplicación afectada"
        />

        <Text style={styles.label}>Prioridad</Text>
        <View style={styles.severityList}>
          {SEVERITIES.map((item) => {
            const selected = item.value === severity
            return (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.severity,
                  selected && { borderColor: item.color, backgroundColor: `${item.color}12` },
                ]}
                onPress={() => setSeverity(item.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.severityName, { color: item.color }]}>{item.label}</Text>
                <Text style={styles.severityDescription}>{item.description}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <Text style={styles.label}>Motivo e información relevante</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Qué ocurre, desde cuándo y a quién afecta"
          multiline
          textAlignVertical="top"
          maxLength={2000}
          accessibilityLabel="Motivo de la incidencia"
        />

        <TouchableOpacity
          style={[styles.submitButton, createIncident.isPending && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={createIncident.isPending}
          accessibilityRole="button"
        >
          {createIncident.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Crear incidencia</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    height: 56,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1a202c' },
  cancel: { color: '#4a5568', fontSize: 15 },
  save: { color: '#003087', fontSize: 15, fontWeight: '700' },
  form: { padding: 16, gap: 10, paddingBottom: 32 },
  intro: { color: '#4a5568', fontSize: 14, lineHeight: 20, marginBottom: 4 },
  label: { color: '#1a202c', fontSize: 15, fontWeight: '700', marginTop: 10 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    color: '#1a202c',
  },
  textarea: { minHeight: 132, paddingTop: 12 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 18,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionSelected: { borderColor: '#003087', backgroundColor: '#e8f0fe' },
  optionText: { color: '#4a5568', fontSize: 14 },
  optionTextSelected: { color: '#003087', fontWeight: '700' },
  severityList: { gap: 8 },
  severity: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
  },
  severityName: { fontWeight: '700', fontSize: 15 },
  severityDescription: { color: '#718096', fontSize: 13, marginTop: 2 },
  errorBanner: {
    backgroundColor: '#fff5f5',
    borderColor: '#feb2b2',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: '#c53030', fontSize: 14 },
  help: { color: '#718096', fontSize: 14, lineHeight: 20 },
  submitButton: {
    marginTop: 14,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#003087',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
