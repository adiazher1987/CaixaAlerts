import type { CreateNodoDto, UpdateNodoDto } from '@caixalertas/types'
import { NodoModel } from './estructura.model'
import { AppError } from '../../middleware/errorHandler.middleware'

export class EstructuraService {
  async getTree() {
    const nodos = await NodoModel.find().sort({ tipo: 1, nombre: 1 })
    return nodos.map((n) => n.toJSON())
  }

  async getById(id: string) {
    const nodo = await NodoModel.findById(id)
    if (!nodo) throw new AppError(404, 'NOT_FOUND', 'Nodo no encontrado')
    return nodo.toJSON()
  }

  async create(dto: CreateNodoDto) {
    if (dto.parentId) {
      const parent = await NodoModel.findById(dto.parentId)
      if (!parent) throw new AppError(404, 'NOT_FOUND', 'Nodo padre no encontrado')
      if (parent.tipo === 'guardia') throw new AppError(400, 'BAD_REQUEST', 'Una guardia no puede tener hijos')
    }
    const nodo = await NodoModel.create(dto)
    return nodo.toJSON()
  }

  async update(id: string, dto: UpdateNodoDto) {
    const nodo = await NodoModel.findByIdAndUpdate(id, dto, { new: true, runValidators: true })
    if (!nodo) throw new AppError(404, 'NOT_FOUND', 'Nodo no encontrado')
    return nodo.toJSON()
  }

  async delete(id: string) {
    const children = await NodoModel.countDocuments({ parentId: id })
    if (children > 0) throw new AppError(400, 'BAD_REQUEST', 'No se puede eliminar un nodo con hijos')
    const nodo = await NodoModel.findByIdAndDelete(id)
    if (!nodo) throw new AppError(404, 'NOT_FOUND', 'Nodo no encontrado')
  }
}
