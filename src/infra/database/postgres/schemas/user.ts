import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  Relation,
  UpdateDateColumn
} from 'typeorm';

import { UserRoleEnum } from '@/core/user/entity/user';

import { UserPasswordSchema } from './userPassword';

@Entity({ name: 'users' })
export class UserSchema extends BaseEntity {
  @Column({ type: 'uuid', primary: true })
  id: string;

  @Column('text')
  name: string;

  @Column('text', { unique: true })
  email: string;

  @OneToOne(() => UserPasswordSchema, { cascade: ['insert', 'remove', 'update', 'soft-remove'] })
  @JoinColumn()
  password: Relation<UserPasswordSchema>;

  @Column({ type: 'enum', enum: UserRoleEnum, array: true })
  roles: UserRoleEnum[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}
