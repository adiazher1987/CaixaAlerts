import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { UserRole } from '@caixalertas/types'
import { useCreateUser } from '../../../src/hooks/useUsers'

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
  email: z.string().email('Email no válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  phone: z.string().optional(),
  role: z.enum(['superadmin', 'responsable_cliente', 'responsable_grupo', 'responsable_guardia', 'miembro_guardia', 'readonly']),
})
type FormData = z.infer<typeof schema>

export default function NewUserScreen() {
  const createUser = useCreateUser()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'guardia' },
  })
  const selectedRole = watch('role')

  const onSubmit = async (data: FormData) => {
    setErrorMsg(null)
    try {
      await createUser.mutateAsync(data)
      router.back()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al crear el usuario')
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.cancel}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nuevo usuario</Text>
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={createUser.isPending}
          accessibilityRole="button"
        >
          {createUser.isPending
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
                placeholder="María García"
                autoCapitalize="words"
              />
            )}
          />
        </Field>

        <Field label="Correo electrónico" error={errors.email?.message}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="usuario@nttdata.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
        </Field>

        <Field label="Contraseña inicial" error={errors.password?.message}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Mínimo 8 caracteres"
                secureTextEntry
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
                placeholder="+34 600 000 000"
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
      </ScrollView>
    </View>
  )
}

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
    {error && <Text style={styles.fieldError}>{error}</Text>}
  </View>
)

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
  errorBanner: { backgroundColor: '#fff5f5', borderLeftWidth: 4, borderLeftColor: '#e53e3e', padding: 12, margin: 16, borderRadius: 4 },
  errorBannerText: { color: '#c53030', fontSize: 14 },
  form: { flex: 1 },
  formContent: { padding: 16, gap: 16 },
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
})
