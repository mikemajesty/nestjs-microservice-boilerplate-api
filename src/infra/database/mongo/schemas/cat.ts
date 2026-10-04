/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/database.md
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { Document, PaginateModel,Schema as MongooseSchema } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

import { CatEntity } from '@/core/cat/entity/cat'
import { IMongoSchema } from '@/utils/mongoose'

export type CatDocument = Document & CatEntity

@Schema({
  collection: 'cats',
  autoIndex: true,
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})
export class Cat implements IMongoSchema<CatDocument> {
  @Prop({ type: String })
  _id!: string

  @Prop({ min: 0, max: 200, required: true, type: String })
  name!: string

  @Prop({ min: 0, max: 200, required: true, type: String })
  breed!: string

  @Prop({ min: 0, max: 200, required: true, type: Number })
  age!: number

  @Prop({ type: Date, default: null })
  deletedAt!: Date

  repository(connection: mongoose.Connection): PaginateModel<CatDocument> {
    type Model = PaginateModel<CatDocument>

    const repository = connection.model<CatDocument, Model>(this.constructor.name, CatSchema as MongooseSchema)
    return repository
  }
}

const CatSchema = SchemaFactory.createForClass(Cat)

CatSchema.index({ name: 1 }, { partialFilterExpression: { deletedAt: { $eq: null } } })

CatSchema.index({ deletedAt: 1 })

CatSchema.index({ deletedAt: 1, createdAt: -1 })
CatSchema.index({ deletedAt: 1, updatedAt: -1 })

CatSchema.index({ deletedAt: 1, createdAt: -1, _id: 1 })

CatSchema.plugin(paginate)

CatSchema.virtual('id').get(function () {
  return this._id
})

export { CatSchema }
