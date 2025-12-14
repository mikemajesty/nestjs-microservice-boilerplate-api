import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
  Relation,
  UpdateDateColumn
} from 'typeorm'

import { RoleSchema } from './role'
import { UserPasswordSchema } from './user-password'

@Entity({ name: 'users' })
@Index('idx_users_email_not_deleted', ['email'], {
  where: '"deleted_at" IS NULL',
})
@Index('idx_users_email_deleted_at', ['email', 'deletedAt'])
@Index('idx_users_name_trgm', ['name'])
@Index('idx_users_name_lower', ['name'], {
  where: '"deleted_at" IS NULL',
})
@Index('idx_users_deleted_name_created', ['deletedAt', 'name', 'createdAt'])
@Index('idx_users_deleted_created_id', ['deletedAt', 'createdAt', 'id'])
@Index('idx_users_active_all', ['id', 'name', 'email', 'createdAt'], {
  where: '"deleted_at" IS NULL',
})
export class UserSchema extends BaseEntity {
  @Column({ type: 'uuid', primary: true })
  id!: string

  @Column('text')
  name!: string

  @Column('text')
  email!: string

  @OneToOne(() => UserPasswordSchema, { cascade: ['insert', 'recover', 'update', 'remove', 'soft-remove'] })
  @JoinColumn()
  password!: Relation<UserPasswordSchema>

  @ManyToMany(() => RoleSchema, { eager: true, cascade: ['recover'] })
  @JoinTable({ name: 'users_roles' })
  roles!: Relation<RoleSchema[]>

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date
}
