import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';
import { v4 as uuidv4 } from 'uuid';

import { UserEntity, UserRole } from '@/core/user/entity/user';

export type UserDocument = Document & UserEntity;

@Schema({ autoIndex: true })
class Organization {
  @Prop({ default: uuidv4, type: String })
  _id: string;

  @Prop({ index: true, required: true, min: 0, max: 200, type: String })
  name: string;
}

@Schema({
  collection: 'user-collection',
  autoIndex: true,
  timestamps: true
})
export class User {
  @Prop({ type: String })
  _id: string;

  @Prop({ index: true, min: 0, max: 200, required: true, type: String })
  clientId: string;

  @Prop({ index: true, min: 0, max: 200, required: true, type: String })
  clientSecret: string;

  @Prop({ type: SchemaFactory.createForClass(Organization), required: true })
  organization: Organization;

  @Prop({ enum: UserRole, type: Array, required: true })
  roles: UserRole[];

  @Prop({ type: Date, default: null })
  deletedAt: Date;
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ clientId: 1, clientSecret: 1 }, { unique: true });

UserSchema.plugin(paginate);

UserSchema.virtual('id').get(function () {
  return this._id;
});

export { UserSchema };
