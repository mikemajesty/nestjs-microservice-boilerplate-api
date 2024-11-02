import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  Relation,
  UpdateDateColumn
} from 'typeorm';

import { UserSchema } from './user';

@Entity({ name: 'reset_password' })
export class ResetPasswordSchema extends BaseEntity {
  @Column({ type: 'uuid', primary: true })
  id!: string;

  @Column('text')
  token!: string;

  @ManyToOne(() => UserSchema, { cascade: ['insert', 'remove', 'update', 'soft-remove'], eager: true })
  @JoinColumn()
  user!: Relation<UserSchema>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;
}
