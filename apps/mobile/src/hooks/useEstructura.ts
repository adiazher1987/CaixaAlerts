import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient } from '@caixalertas/api-client'
import type { CreateNodoDto, UpdateNodoDto } from '@caixalertas/types'

const KEY = ['estructura'] as const

export const useEstructura = () =>
  useQuery({
    queryKey: KEY,
    queryFn: () => getApiClient().estructura.getTree(),
    select: (r) => r.data ?? [],
  })

export const useCreateNodo = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateNodoDto) => getApiClient().estructura.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export const useUpdateNodo = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateNodoDto }) =>
      getApiClient().estructura.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export const useDeleteNodo = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => getApiClient().estructura.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
