import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

import { ResetPasswordEntity } from '@/core/reset-password/entity/reset-password';

export type ResetPasswordDocument = Document & ResetPasswordEntity;

@Schema({
  collection: 'resetPasswordTokens',
  autoIndex: true,
  timestamps: true
})
export class ResetPassword {
  @Prop({ type: String })
  _id: string;

  @Prop({ index: true, min: 1, required: true, type: String })
  token: string;

  @Prop({ index: true, min: 1, max: 200, required: true, type: String })
  userId: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  @Prop({ type: Date, expires: 1200, default: Date.now })
  createdAt: Date;
}

const ResetPasswordSchema = SchemaFactory.createForClass(ResetPassword);

ResetPasswordSchema.index({ name: 1 });

ResetPasswordSchema.plugin(paginate);

ResetPasswordSchema.virtual('id').get(function () {
  return this._id;
});

export { ResetPasswordSchema };
