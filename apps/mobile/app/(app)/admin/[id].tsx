import React, { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, StyleSheet, Switch,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { UserRole } from '@caixalertas/types'
import { useUsers, useUpdateUser, useUnlockUser } from '../../../src/hooks/useUsers'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'responsable_cliente', label: 'Responsable Cliente' },
  { value: 'responsable_grupo', label: 'Responsable Grupo' },
  { value: 'responsable_guardia', label: 'Responsable Guardia' },
  { value: 'miembro_guardia', label: 'Miembro Guardia' },
  { value: 'readonly', label: 'Solo Lectura' },
]

const schema = z.object({
  name: z.string().min(2, 'Nombre obligatorio'),
  phone: z.string().optional(),
  role: z.enum(['superadmin', 'responsable_cliente', 'responsable_grupo', 'responsable_guardia', 'miembro_guardia', 'readonly']),
  isActive: z.boolean(),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

export default function EditUserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: users = [] } = useUsers()
  const user = users.find((u) => u.id === id)
  const updateUser = useUpdateUser()
  const unlockUser = useUnlockUser()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { control, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'guardia', isActive: true },
  })
  const selectedRole = watch('role')

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        phone: user.phone ?? '',
        role: user.role,
        isActive: user.isActive,
        password: '',
      })
    }
  }, [user])

  const onSubmit = async (data: FormData) => {
    if (!id) return
    setErrorMsg(null)
    try {
      const { password, ...rest } = data
      await updateUser.mutateAsync({ id, dto: password ? { ...rest, password } : rest })
      router.back()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al actualizar el usuario')
    }
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003087" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.cancel}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Editar usuario</Text>
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={updateUser.isPending}
          accessibilityRole="button"
        >
          {updateUser.isPending
            ? <ActivityIndicator color="#003087" />
            : <Text style={styles.save}>Guardar</Text>}
        </TouchableOpacity>
      </View>

      {errorMsg && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorMsg}</Text>
        </View>
      )}

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        <View style={styles.emailRow}>
          <Text style={styles.emailLabel}>Email</Text>
          <Text style={styles.emailValue}>{user.email}</Text>
        </View>

        <Field label="Nombre completo" error={errors.name?.message}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
              />
            )}
          />
        </Field>

        <Field label="Teléfono (opcional)" error={errors.phone?.message}>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="phone-pad"
              />
            )}
          />
        </Field>

        <Text style={styles.fieldLabel}>Rol</Text>
        <View style={styles.roleGrid}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.roleOption, selectedRole === r.value && styles.roleOptionSelected]}
              onPress={() => setValue('role', r.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedRole === r.value }}
            >
              <Text style={[styles.roleOptionText, selectedRole === r.value && styles.roleOptionTextSelected]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field label="Nueva contraseña (dejar vacío para no cambiar)" error={errors.password?.message}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                placeholder="••••••••"
                autoComplete="off"
              />
            )}
          />
        </Field>

        {user.isLocked && (
          <View style={styles.lockedBanner}>
            <Text style={styles.lockedText}>Cuenta bloqueada por intentos fallidos</Text>
            <TouchableOpacity
              onPress={() => unlockUser.mutate(user.id)}
              disabled={unlockUser.isPending}
              style={styles.unlockBtn}
              accessibilityRole="button"
            >
              {unlockUser.isPending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.unlockBtnText}>Desbloquear</Text>}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.fieldLabel}>Cuenta activa</Text>
          <Controller
            control={control}
            name="isActive"
            render={({ field: { onChange, value } }) => (
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ true: '#003087' }}
                accessibilityLabel="Cuenta activa"
              />
            )}
          />
        </View>
      </ScrollView>
    </View>
  )
}

const Field = ({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
    {error && <Text style={styles.fieldError}>{error}</Text>}
  </View>
)

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBanner: { backgroundColor: '#fff5f5', borderLeftWidth: 4, borderLeftColor: '#e53e3e', padding: 12, margin: 16, borderRadius: 4 },
  errorBannerText: { color: '#c53030', fontSize: 14 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  cancel: { fontSize: 16, color: '#666' },
  title: { fontSize: 17, fontWeight: '600', color: '#1a202c' },
  save: { fontSize: 16, color: '#003087', fontWeight: '600' },
  form: { flex: 1 },
  formContent: { padding: 16, gap: 16 },
  emailRow: {
    backgroundColor: '#f7fafc', borderRadius: 8, padding: 14,
    borderWidth: 1, borderColor: '#e2e8f0', gap: 4,
  },
  emailLabel: { fontSize: 12, color: '#999' },
  emailValue: { fontSize: 15, color: '#1a202c' },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: '#333' },
  fieldError: { fontSize: 12, color: '#e53e3e' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16,
    backgroundColor: '#fafafa', minHeight: 48,
  },
  inputError: { borderColor: '#e53e3e' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleOption: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fafafa',
  },
  roleOptionSelected: { borderColor: '#003087', backgroundColor: '#003087' },
  roleOptionText: { fontSize: 14, color: '#333' },
  roleOptionTextSelected: { color: '#fff', fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lockedBanner: {
    backgroundColor: '#fffaf0', borderLeftWidth: 4, borderLeftColor: '#d69e2e',
    padding: 12, borderRadius: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  lockedText: { color: '#92400e', fontSize: 14, flex: 1 },
  unlockBtn: { backgroundColor: '#d69e2e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginLeft: 8 },
  unlockBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
})
