import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import type { NodoTipo } from '@caixalertas/types'
import { useCreateNodo } from '../../../src/hooks/useEstructura'

const TIPOS: { value: NodoTipo; label: string; icon: string; desc: string }[] = [
  { value: 'cliente', label: 'Cliente', icon: '🏢', desc: 'Nodo raíz de la jerarquía' },
  { value: 'agrupacion', label: 'Agrupación', icon: '📁', desc: 'Agrupa guardias o subagrupaciones' },
  { value: 'guardia', label: 'Guardia', icon: '🛡️', desc: 'Equipo de guardia operativo' },
]

export default function NewNodoScreen() {
  const { parentId, parentTipo } = useLocalSearchParams<{ parentId?: string; parentTipo?: string }>()
  const createNodo = useCreateNodo()
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<NodoTipo>(parentTipo === 'root' ? 'cliente' : 'agrupacion')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Tipos disponibles según el padre
  const tiposDisponibles = parentTipo === 'root'
    ? TIPOS.filter((t) => t.value === 'cliente')
    : TIPOS.filter((t) => t.value !== 'cliente')

  const onSubmit = async () => {
    if (!nombre.trim()) { setErrorMsg('El nombre es obligatorio'); return }
    setErrorMsg(null)
    try {
      await createNodo.mutateAsync({ nombre: nombre.trim(), tipo, parentId })
      router.back()
    } catch (err: unknown) {
      setErrorMsg((err as { message?: string })?.message ?? 'Error al crear el nodo')
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.cancel}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nuevo nodo</Text>
        <TouchableOpacity onPress={onSubmit} disabled={createNodo.isPending} accessibilityRole="button">
          {createNodo.isPending
            ? <ActivityIndicator color="#003087" />
            : <Text style={styles.save}>Crear</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        {errorMsg && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre del nodo"
          autoFocus
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Tipo</Text>
        {tiposDisponibles.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.tipoCard, tipo === t.value && styles.tipoCardSelected]}
            onPress={() => setTipo(t.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: tipo === t.value }}
          >
            <Text style={styles.tipoIcon}>{t.icon}</Text>
            <View style={styles.tipoInfo}>
              <Text style={[styles.tipoLabel, tipo === t.value && styles.tipoLabelSelected]}>{t.label}</Text>
              <Text style={styles.tipoDesc}>{t.desc}</Text>
            </View>
            {tipo === t.value && <Text style={styles.tipoCheck}>✓</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  cancel: { fontSize: 16, color: '#666' },
  title: { fontSize: 17, fontWeight: '600', color: '#1a202c' },
  save: { fontSize: 16, color: '#003087', fontWeight: '600' },
  form: { padding: 16, gap: 8 },
  errorBanner: { backgroundColor: '#fff5f5', borderLeftWidth: 4, borderLeftColor: '#e53e3e', padding: 12, borderRadius: 4 },
  errorText: { color: '#c53030', fontSize: 14 },
  label: { fontSize: 14, fontWeight: '500', color: '#333' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16,
    backgroundColor: '#fafafa', minHeight: 48,
  },
  tipoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, backgroundColor: '#fafafa',
  },
  tipoCardSelected: { borderColor: '#003087', backgroundColor: '#ebf4ff' },
  tipoIcon: { fontSize: 24 },
  tipoInfo: { flex: 1 },
  tipoLabel: { fontSize: 15, fontWeight: '600', color: '#333' },
  tipoLabelSelected: { color: '#003087' },
  tipoDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  tipoCheck: { fontSize: 18, color: '#003087' },
})
