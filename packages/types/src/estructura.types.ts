export type NodoTipo = 'cliente' | 'agrupacion' | 'guardia'

export interface Aplicacion {
  idCliente: string
  nombre: string
  descripcion?: string
}

export interface NodoEstructura {
  id: string
  nombre: string
  tipo: NodoTipo
  parentId?: string
  // Agrupación/Cliente: personas a alertar
  contactosAlerta?: string[]   // IDs de usuario
  // Guardia: detalle
  descripcion?: string
  responsables?: string[]      // IDs de usuarios responsables
  miembros?: string[]          // IDs de usuario (miembro_guardia)
  aplicaciones?: Aplicacion[]
  createdAt: string
  updatedAt: string
}

export interface CreateNodoDto {
  nombre: string
  tipo: NodoTipo
  parentId?: string
  descripcion?: string
}

export interface UpdateNodoDto {
  nombre?: string
  descripcion?: string
  contactosAlerta?: string[]
  responsables?: string[]
  miembros?: string[]
  aplicaciones?: Aplicacion[]
}
