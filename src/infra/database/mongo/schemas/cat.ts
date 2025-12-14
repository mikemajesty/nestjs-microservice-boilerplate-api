import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { CatEntity } from '@/core/cat/entity/cat'

export type CatDocument = Document & CatEntity

@Schema({
  collection: 'cats',
  autoIndex: true,
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})
export class Cat {
  @Prop({ type: String })
  _id!: string

  @Prop({ min: 0, max: 200, required: true, type: String })
  name!: string

  @Prop({ min: 0, max: 200, required: true, type: String })
  breed!: string

  @Prop({ min: 0, max: 200, required: true, type: Number })
  age!: string

  @Prop({ type: Date, default: null })
  deletedAt!: Date
}

const CatSchema = SchemaFactory.createForClass(Cat)

// Index para busca por nome em cats não deletados (query mais comum)
CatSchema.index({ name: 1 }, { partialFilterExpression: { deletedAt: { $eq: null } } })

// Index para filtrar por deletedAt (usado em todas as queries de listagem)
CatSchema.index({ deletedAt: 1 })

// Index composto para ordenação por createdAt/updatedAt em cats não deletados
CatSchema.index({ deletedAt: 1, createdAt: -1 })
CatSchema.index({ deletedAt: 1, updatedAt: -1 })

// Index para paginação eficiente com ordenação
CatSchema.index({ deletedAt: 1, createdAt: -1, _id: 1 })

CatSchema.plugin(paginate)

CatSchema.virtual('id').get(function () {
  return this._id
})

export { CatSchema }
