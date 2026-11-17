import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import type { Aplicacion, UserRole } from '@caixalertas/types'
import { useEstructura, useUpdateNodo, useDeleteNodo } from '../../../src/hooks/useEstructura'
import { useUsers } from '../../../src/hooks/useUsers'

const ROLE_ORDER: UserRole[] = [
  'superadmin', 'responsable_cliente', 'responsable_grupo',
  'responsable_guardia', 'miembro_guardia', 'readonly',
]

const CONTACTO_ROLES: UserRole[] = [
  'superadmin', 'responsable_cliente', 'responsable_grupo', 'responsable_guardia',
]

const ROLE_LABEL: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  responsable_cliente: 'Responsable Cliente',
  responsable_grupo: 'Responsable Grupo',
  responsable_guardia: 'Responsable Guardia',
  miembro_guardia: 'Miembro Guardia',
  readonly: 'Solo Lectura',
}

export default function NodoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: nodos = [] } = useEstructura()
  const nodo = nodos.find((n) => n.id === id)
  const updateNodo = useUpdateNodo()
  const deleteNodo = useDeleteNodo()

  const { data: users = [], isError: usersError, isLoading: usersLoading } = useUsers()
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([])
  const [contactosAlerta, setContactosAlerta] = useState<string[]>([])
  const [collapsedRoles, setCollapsedRoles] = useState<Set<string>>(new Set())
  const [expandedApps, setExpandedApps] = useState<Set<number>>(new Set())
  const [responsables, setResponsables] = useState<string[]>([])
  const [miembros, setMiembros] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (nodo) {
      setNombre(nodo.nombre)
      setDescripcion(nodo.descripcion ?? '')
      setAplicaciones(nodo.aplicaciones ?? [])
      setContactosAlerta(nodo.contactosAlerta ?? [])
      setResponsables(nodo.responsables ?? [])
      setMiembros(nodo.miembros ?? [])
    }
  }, [nodo])

  const onSave = async () => {
    if (!nombre.trim()) { setErrorMsg('El nombre es obligatorio'); return }
    setErrorMsg(null)
    try {
      await updateNodo.mutateAsync({
        id: id!,
        dto: { nombre: nombre.trim(), descripcion, aplicaciones, contactosAlerta, responsables, miembros },
      })
      router.back()
    } catch (err: unknown) {
      setErrorMsg((err as { message?: string })?.message ?? 'Error al guardar')
    }
  }

  const onDelete = () => {
    if (typeof window !== 'undefined') {
      if (!window.confirm(`¿Eliminar "${nodo?.nombre}"? Esta acción no se puede deshacer.`)) return
      deleteNodo.mutate(id!, { onSuccess: () => router.back() })
      return
    }
    const { Alert } = require('react-native')
    Alert.alert('Eliminar nodo', `¿Eliminar "${nodo?.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteNodo.mutate(id!, { onSuccess: () => router.back() }) },
    ])
  }

  const addAplicacion = () => {
    setAplicaciones((prev) => {
      const newIndex = prev.length
      setExpandedApps((exp) => new Set(exp).add(newIndex))
      return [...prev, { idCliente: '', nombre: '', descripcion: '' }]
    })
  }
  const removeAplicacion = (i: number) => setAplicaciones((prev) => prev.filter((_, idx) => idx !== i))
  const updateAplicacion = (i: number, field: keyof Aplicacion, value: string) =>
    setAplicaciones((prev) => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a))

  if (!nodo) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#003087" /></View>
  }

  const TIPO_LABEL: Record<string, string> = { cliente: 'Cliente', agrupacion: 'Agrupación', guardia: 'Guardia' }
  const TIPO_COLOR: Record<string, string> = { cliente: '#003087', agrupacion: '#6b46c1', guardia: '#2f855a' }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.cancel}>Cancelar</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{TIPO_LABEL[nodo.tipo]}</Text>
          <View style={[styles.tipoBadge, { backgroundColor: TIPO_COLOR[nodo.tipo] }]}>
            <Text style={styles.tipoBadgeText}>{TIPO_LABEL[nodo.tipo]}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onSave} disabled={updateNodo.isPending} accessibilityRole="button">
          {updateNodo.isPending ? <ActivityIndicator color="#003087" /> : <Text style={styles.save}>Guardar</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        {errorMsg && (
          <View style={styles.errorBanner}><Text style={styles.errorText}>{errorMsg}</Text></View>
        )}

        <Text style={styles.label}>Nombre</Text>
        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />

        {(nodo.tipo === 'cliente' || nodo.tipo === 'agrupacion') && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 16 }]}>
              <Text style={styles.sectionTitle}>Contactos de alerta</Text>
              <Text style={styles.sectionSubtitle}>Se notificarán al escalar</Text>
            </View>
            {usersLoading && <ActivityIndicator color="#003087" />}
            {usersError && (
              <Text style={styles.emptySection}>Error al cargar usuarios</Text>
            )}
            {!usersLoading && !usersError && users.length === 0 && (
              <Text style={styles.emptySection}>No hay usuarios en el sistema</Text>
            )}
            {!usersLoading && !usersError && ROLE_ORDER.filter((r) => CONTACTO_ROLES.includes(r)).flatMap((role) => {
              const group = users.filter((u) => u.role === role)
              if (group.length === 0) return []
              const isCollapsed = collapsedRoles.has(role)
              const selectedCount = group.filter((u) => contactosAlerta.includes(u.id)).length
              return [
                <TouchableOpacity
                  key={`header-${role}`}
                  style={styles.roleHeaderRow}
                  onPress={() =>
                    setCollapsedRoles((prev) => {
                      const next = new Set(prev)
                      next.has(role) ? next.delete(role) : next.add(role)
                      return next
                    })
                  }
                  accessibilityRole="button"
                >
                  <Text style={styles.roleHeader}>{ROLE_LABEL[role]}</Text>
                  <View style={styles.roleHeaderRight}>
                    {selectedCount > 0 && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>{selectedCount}</Text>
                      </View>
                    )}
                    <Text style={styles.roleChevron}>{isCollapsed ? '+' : '−'}</Text>
                  </View>
                </TouchableOpacity>,
                ...(!isCollapsed ? group.map((u) => {
                  const selected = contactosAlerta.includes(u.id)
                  return (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.userRow, selected && styles.userRowSelected]}
                      onPress={() =>
                        setContactosAlerta((prev) =>
                          selected ? prev.filter((x) => x !== u.id) : [...prev, u.id]
                        )
                      }
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                    >
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{u.name}{!u.isActive ? ' (inactivo)' : ''}</Text>
                        <Text style={styles.userEmail}>{u.email}</Text>
                      </View>
                      {selected && <Text style={styles.checkIcon}>✓</Text>}
                    </TouchableOpacity>
                  )
                }) : []),
              ]
            })}
          </>
        )}

        {(nodo.tipo === 'agrupacion' || nodo.tipo === 'guardia') && (
          <>
            <Text style={[styles.label, { marginTop: 16 }]}>Descripción</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              placeholder="Descripción del nodo..."
            />
          </>
        )}

        {nodo.tipo === 'guardia' && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 16 }]}>
              <Text style={styles.sectionTitle}>Responsable</Text>
            </View>
            {usersLoading && <ActivityIndicator color="#003087" />}
            {!usersLoading && !usersError && users.filter((u) => u.role === 'responsable_guardia').map((u) => {
              const selected = responsables.includes(u.id)
              return (
                <TouchableOpacity
                  key={u.id}
                  style={[styles.userRow, selected && styles.userRowSelected]}
                  onPress={() =>
                    setResponsables((prev) =>
                      selected ? prev.filter((x) => x !== u.id) : [...prev, u.id]
                    )
                  }
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                >
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                  </View>
                  {selected && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              )
            })}
            {!usersLoading && !usersError && users.filter((u) => u.role === 'responsable_guardia').length === 0 && (
              <Text style={styles.emptySection}>No hay responsables de guardia configurados</Text>
            )}

            <View style={[styles.sectionHeader, { marginTop: 16 }]}>
              <Text style={styles.sectionTitle}>Integrantes de guardia</Text>
            </View>
            {!usersLoading && !usersError && users.filter((u) => u.role === 'miembro_guardia').map((u) => {
              const selected = miembros.includes(u.id)
              return (
                <TouchableOpacity
                  key={u.id}
                  style={[styles.userRow, selected && styles.userRowSelected]}
                  onPress={() =>
                    setMiembros((prev) =>
                      selected ? prev.filter((x) => x !== u.id) : [...prev, u.id]
                    )
                  }
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                >
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                  </View>
                  {selected && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              )
            })}
            {!usersLoading && !usersError && users.filter((u) => u.role === 'miembro_guardia').length === 0 && (
              <Text style={styles.emptySection}>No hay miembros de guardia configurados</Text>
            )}

            <View style={[styles.sectionHeader, { marginTop: 16 }]}>
              <Text style={styles.sectionTitle}>Aplicaciones</Text>
              <TouchableOpacity onPress={addAplicacion} style={styles.addBtn} accessibilityRole="button">
                <Text style={styles.addBtnText}>+ Añadir</Text>
              </TouchableOpacity>
            </View>

            {aplicaciones.length === 0 && (
              <Text style={styles.emptySection}>No hay aplicaciones configuradas</Text>
            )}

            {aplicaciones.map((app, i) => {
              const isExpanded = expandedApps.has(i)
              const toggleApp = () =>
                setExpandedApps((prev) => {
                  const next = new Set(prev)
                  next.has(i) ? next.delete(i) : next.add(i)
                  return next
                })
              return (
                <View key={i} style={styles.appCard}>
                  <TouchableOpacity
                    style={styles.appCardCollapsed}
                    onPress={toggleApp}
                    accessibilityRole="button"
                  >
                    <View style={styles.appCardHeaderLeft}>
                      <Text style={styles.appCardIdLine} numberOfLines={1}>
                        {app.idCliente || <Text style={styles.appCardPlaceholder}>ID aplicación cliente</Text>}
                      </Text>
                      <Text style={styles.appCardNameLine} numberOfLines={1}>
                        {[app.nombre, app.descripcion].filter(Boolean).join(' · ') || <Text style={styles.appCardPlaceholder}>Nombre · Descripción</Text>}
                      </Text>
                    </View>
                    <View style={styles.appCardHeaderRight}>
                      <Text style={styles.appChevron}>{isExpanded ? '▾' : '▸'}</Text>
                      <TouchableOpacity onPress={() => removeAplicacion(i)} accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.removeBtn}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={styles.appCardFields}>
                      <TextInput
                        style={styles.input}
                        value={app.idCliente}
                        onChangeText={(v) => updateAplicacion(i, 'idCliente', v)}
                        placeholder="ID aplicación cliente"
                      />
                      <TextInput
                        style={[styles.input, { marginTop: 8 }]}
                        value={app.nombre}
                        onChangeText={(v) => updateAplicacion(i, 'nombre', v)}
                        placeholder="Nombre de la aplicación"
                      />
                      <TextInput
                        style={[styles.input, { marginTop: 8, minHeight: 64 }]}
                        value={app.descripcion ?? ''}
                        onChangeText={(v) => updateAplicacion(i, 'descripcion', v)}
                        placeholder="Descripción..."
                        multiline
                      />
                    </View>
                  )}
                </View>
              )
            })}
          </>
        )}

        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} accessibilityRole="button">
          <Text style={styles.deleteBtnText}>Eliminar nodo</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  headerCenter: { alignItems: 'center', gap: 4 },
  cancel: { fontSize: 16, color: '#666' },
  title: { fontSize: 17, fontWeight: '600', color: '#1a202c' },
  save: { fontSize: 16, color: '#003087', fontWeight: '600' },
  tipoBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tipoBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  form: { padding: 16, gap: 8 },
  errorBanner: { backgroundColor: '#fff5f5', borderLeftWidth: 4, borderLeftColor: '#e53e3e', padding: 12, borderRadius: 4 },
  errorText: { color: '#c53030', fontSize: 14 },
  label: { fontSize: 14, fontWeight: '500', color: '#333' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16,
    backgroundColor: '#fafafa', minHeight: 48,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  sectionSubtitle: { fontSize: 12, color: '#999' },
  userRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  userRowSelected: { borderColor: '#003087', backgroundColor: '#ebf4ff' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: '#1a202c' },
  userEmail: { fontSize: 12, color: '#718096', marginTop: 1 },
  checkIcon: { fontSize: 16, color: '#003087', fontWeight: '700' },
  roleHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 2, paddingVertical: 4 },
  roleHeader: { fontSize: 11, fontWeight: '700', color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5 },
  roleHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleChevron: { fontSize: 12, color: '#718096' },
  selectedBadge: { backgroundColor: '#003087', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  selectedBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  addBtn: { backgroundColor: '#003087', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptySection: { fontSize: 14, color: '#999', fontStyle: 'italic' },
  appCard: { backgroundColor: '#f7fafc', borderRadius: 8, padding: 12, gap: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  appCardCollapsed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appCardHeaderLeft: { flex: 1, marginRight: 8 },
  appCardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appCardIdLine: { fontSize: 14, fontWeight: '600', color: '#1a202c' },
  appCardNameLine: { fontSize: 12, color: '#718096', marginTop: 2 },
  appCardPlaceholder: { color: '#bbb', fontStyle: 'italic' },
  appCardFields: { marginTop: 10 },
  appChevron: { fontSize: 13, color: '#888' },
  removeBtn: { fontSize: 16, color: '#e53e3e' },
  deleteBtn: { marginTop: 24, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e53e3e', alignItems: 'center' },
  deleteBtnText: { color: '#e53e3e', fontSize: 15, fontWeight: '600' },
})
