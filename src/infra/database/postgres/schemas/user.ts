import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
  Relation,
  UpdateDateColumn
} from 'typeorm';

import { RoleSchema } from './role';
import { UserPasswordSchema } from './user-password';

@Entity({ name: 'users' })
export class UserSchema extends BaseEntity {
  @Column({ type: 'uuid', primary: true })
  id!: string;

  @Column('text')
  name!: string;

  @Column('text')
  email!: string;

  @OneToOne(() => UserPasswordSchema, { cascade: ['insert', 'recover', 'update', 'remove', 'soft-remove'] })
  @JoinColumn()
  password!: Relation<UserPasswordSchema>;

  @ManyToMany(() => RoleSchema, { eager: true, cascade: ['recover'] })
  @JoinTable({ name: 'users_roles' })
  roles!: Relation<RoleSchema[]>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;
}
