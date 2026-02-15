import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  Relation,
  UpdateDateColumn
} from 'typeorm'

import { RoleEnum } from '@/core/role/entity/role'

import { PermissionSchema } from './permission'

@Entity({ name: 'roles' })
@Index('idx_roles_name_trgm', ['name'])
@Index('idx_roles_name_lower', ['name'], {
  where: '"deleted_at" IS NULL'
})
@Index('idx_roles_deleted_name_created', ['deletedAt', 'name', 'createdAt'])
@Index('idx_roles_deleted_created_id', ['deletedAt', 'createdAt', 'id'])
@Index('idx_roles_active_name', ['name', 'id', 'createdAt'], {
  where: '"deleted_at" IS NULL'
})
export class RoleSchema extends BaseEntity {
  @Column({ type: 'uuid', primary: true })
  id!: string

  @Column('text', { unique: true })
  name!: RoleEnum

  @ManyToMany(() => PermissionSchema, { eager: true, cascade: ['recover', 'update'] })
  @JoinTable({ name: 'permissions_roles' })
  permissions!: Relation<PermissionSchema[]>

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date
}
