import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import type { NodoEstructura, NodoTipo } from '@caixalertas/types'
import { useEstructura, useDeleteNodo } from '../../../src/hooks/useEstructura'

const TIPO_COLOR: Record<NodoTipo, string> = {
  cliente: '#003087',
  agrupacion: '#6b46c1',
  guardia: '#2f855a',
}

const TIPO_LABEL: Record<NodoTipo, string> = {
  cliente: 'Cliente',
  agrupacion: 'Agrupación',
  guardia: 'Guardia',
}

const TIPO_ICON: Record<NodoTipo, string> = {
  cliente: '🏢',
  agrupacion: '📁',
  guardia: '🛡️',
}

export default function EstructuraScreen() {
  const { data: nodos = [], isLoading, refetch, isRefetching } = useEstructura()
  const deleteNodo = useDeleteNodo()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const roots = nodos.filter((n) => !n.parentId)

  const renderNode = (nodo: NodoEstructura, depth = 0): React.ReactNode => {
    const children = nodos.filter((n) => n.parentId === nodo.id)
    const hasChildren = children.length > 0
    const isOpen = expanded.has(nodo.id)
    const color = TIPO_COLOR[nodo.tipo]

    return (
      <View key={nodo.id}>
        <View style={[styles.node, { marginLeft: depth * 20 }]}>
          <TouchableOpacity
            style={styles.nodeMain}
            onPress={() => hasChildren ? toggle(nodo.id) : router.push(`/(app)/estructura/${nodo.id}`)}
            onLongPress={() => router.push(`/(app)/estructura/${nodo.id}`)}
            accessibilityRole="button"
          >
            <View style={[styles.typeBadge, { backgroundColor: color }]}>
              <Text style={styles.typeIcon}>{TIPO_ICON[nodo.tipo]}</Text>
            </View>
            <View style={styles.nodeInfo}>
              <Text style={styles.nodeName}>{nodo.nombre}</Text>
              <Text style={[styles.nodeType, { color }]}>{TIPO_LABEL[nodo.tipo]}</Text>
            </View>
            {hasChildren && (
              <Text style={styles.chevron}>{isOpen ? '▾' : '▸'}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.nodeActions}>
            {nodo.tipo !== 'guardia' && (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/(app)/estructura/new', params: { parentId: nodo.id, parentTipo: nodo.tipo } })}
                style={styles.actionBtn}
                accessibilityRole="button"
                accessibilityLabel="Añadir hijo"
              >
                <Text style={styles.actionBtnText}>+</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => router.push(`/(app)/estructura/${nodo.id}`)}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel="Editar"
            >
              <Text style={styles.actionBtnText}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isOpen && children.map((child) => renderNode(child, depth + 1))}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#003087" />
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          contentContainerStyle={roots.length === 0 ? styles.emptyContainer : styles.list}
        >
          {roots.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏢</Text>
              <Text style={styles.emptyText}>No hay estructura definida</Text>
              <Text style={styles.emptySubtext}>Crea el nodo raíz (Cliente) para empezar</Text>
            </View>
          ) : (
            roots.map((n) => renderNode(n))
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push({ pathname: '/(app)/estructura/new', params: { parentTipo: 'root' } })}
        accessibilityRole="button"
        accessibilityLabel="Crear nodo raíz"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loader: { flex: 1 },
  list: { padding: 12 },
  emptyContainer: { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptySubtext: { fontSize: 14, color: '#999', textAlign: 'center' },
  node: {
    backgroundColor: '#fff', borderRadius: 8, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 2, elevation: 1,
  },
  nodeMain: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  typeBadge: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  typeIcon: { fontSize: 18 },
  nodeInfo: { flex: 1 },
  nodeName: { fontSize: 15, fontWeight: '600', color: '#1a202c' },
  nodeType: { fontSize: 12, marginTop: 2 },
  chevron: { fontSize: 16, color: '#999' },
  nodeActions: { flexDirection: 'row', paddingRight: 8, gap: 4 },
  actionBtn: { padding: 8 },
  actionBtnText: { fontSize: 16 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#003087', alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
})
