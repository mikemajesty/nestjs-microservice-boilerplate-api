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

import { RoleSchema } from './role';
import { UserPasswordSchema } from './userPassword';

@Entity({ name: 'users' })
export class UserSchema extends BaseEntity {
  @Column({ type: 'uuid', primary: true })
  id: string;

  @Column('text')
  name: string;

  @Column('text', { unique: true })
  email: string;

  @OneToOne(() => UserPasswordSchema, { cascade: ['insert', 'recover', 'update', 'remove', 'soft-remove'] })
  @JoinColumn()
  password: Relation<UserPasswordSchema>;

  @OneToOne(() => RoleSchema, { cascade: ['insert', 'recover', 'update', 'remove', 'soft-remove'] })
  @JoinColumn()
  role: Relation<RoleSchema>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}
