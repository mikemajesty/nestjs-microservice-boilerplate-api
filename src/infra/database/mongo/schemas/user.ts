import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

import { UserEntity, UserRole } from '@/core/user/entity/user';

export type UserDocument = Document & UserEntity;

@Schema({
  collection: 'users',
  autoIndex: true,
  timestamps: true
})
export class User {
  @Prop({ type: String })
  _id: string;

  @Prop({ min: 0, max: 200, required: true, type: String })
  login: string;

  @Prop({ min: 0, max: 200, required: true, type: String })
  password: string;

  @Prop({ enum: UserRole, type: Array, required: true })
  roles: UserRole[];

  @Prop({ type: Date, default: null })
  deletedAt: Date;
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ login: 1 }, { unique: true, partialFilterExpression: { deletedAt: { $eq: null } } });

UserSchema.plugin(paginate);

UserSchema.virtual('id').get(function () {
  return this._id;
});

export { UserSchema };
