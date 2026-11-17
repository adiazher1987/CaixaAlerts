import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient } from '@caixalertas/api-client'
import type { CreateUserDto, UpdateUserDto } from '@caixalertas/types'

const KEYS = {
  all: ['users'] as const,
  detail: (id: string) => ['users', id] as const,
}

export const useUsers = () =>
  useQuery({
    queryKey: KEYS.all,
    queryFn: () => getApiClient().users.list(),
    select: (r) => r.data ?? [],
  })

export const useCreateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateUserDto) => getApiClient().users.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export const useUpdateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) =>
      getApiClient().users.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export const useUnlockUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => getApiClient().users.unlock(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export const useDeactivateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => getApiClient().users.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
