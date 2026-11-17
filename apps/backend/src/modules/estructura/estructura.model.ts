import mongoose, { type Document, Schema } from 'mongoose'
import type { NodoTipo } from '@caixalertas/types'

export interface INodoDocument extends Document {
  _id: mongoose.Types.ObjectId
  nombre: string
  tipo: NodoTipo
  parentId?: mongoose.Types.ObjectId
  contactosAlerta: mongoose.Types.ObjectId[]
  descripcion?: string
  responsables: mongoose.Types.ObjectId[]
  miembros: mongoose.Types.ObjectId[]
  aplicaciones: { nombre: string; descripcion?: string }[]
  createdAt: Date
  updatedAt: Date
}

const aplicacionSchema = new Schema({ idCliente: { type: String, required: true }, nombre: { type: String, required: true }, descripcion: String }, { _id: false })

const nodoSchema = new Schema<INodoDocument>(
  {
    nombre: { type: String, required: true, trim: true },
    tipo: { type: String, enum: ['cliente', 'agrupacion', 'guardia'], required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'NodoEstructura', default: null },
    contactosAlerta: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    descripcion: { type: String },
    responsables: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    miembros: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    aplicaciones: { type: [aplicacionSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret['id'] = ret['_id']
        delete ret['_id']
        delete ret['__v']
        return ret
      },
    },
  },
)

export const NodoModel = mongoose.model<INodoDocument>('NodoEstructura', nodoSchema)
