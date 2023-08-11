import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';

import { BirdEntity } from '@/core/bird/entity/bird';

export type BirdDocument = Document & BirdEntity;

@Schema({
  collection: 'birds',
  autoIndex: true,
  timestamps: true
})
export class Bird {
  @Prop({ type: String })
  _id: string;

  @Prop({ index: true, min: 1, max: 200, required: true, type: String })
  name: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date;
}

const BirdSchema = SchemaFactory.createForClass(Bird);

BirdSchema.index({ name: 1 });

BirdSchema.plugin(paginate);

BirdSchema.virtual('id').get(function () {
  return this._id;
});

export { BirdSchema };
