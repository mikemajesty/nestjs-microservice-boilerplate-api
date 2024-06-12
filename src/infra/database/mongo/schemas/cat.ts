import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

import { CatsEntity } from '@/core/cat/entity/cats';

export type CatDocument = Document & CatsEntity;

@Schema({
  collection: 'cats',
  autoIndex: true,
  timestamps: true
})
export class Cat {
  @Prop({ type: String })
  _id: string;

  @Prop({ min: 0, max: 200, required: true, type: String })
  name: string;

  @Prop({ min: 0, max: 200, required: true, type: String })
  breed: string;

  @Prop({ min: 0, max: 200, required: true, type: Number })
  age: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date;
}

const CatSchema = SchemaFactory.createForClass(Cat);

CatSchema.index({ name: 1 }, { partialFilterExpression: { deletedAt: { $eq: null } } });

CatSchema.plugin(paginate);

CatSchema.virtual('id').get(function () {
  return this._id;
});

export { CatSchema };
