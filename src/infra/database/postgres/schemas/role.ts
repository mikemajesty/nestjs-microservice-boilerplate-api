import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  Relation,
  UpdateDateColumn
} from 'typeorm';

import { RoleEnum } from '@/core/role/entity/role';

import { PermissionSchema } from './permission';

@Entity({ name: 'roles' })
export class RoleSchema extends BaseEntity {
  @Column({ type: 'uuid', primary: true })
  id!: string;

  @Column('text', { unique: true })
  name!: RoleEnum;

  @ManyToMany(() => PermissionSchema, { eager: true, cascade: ['insert', 'recover', 'update'] })
  @JoinTable({ name: 'permissions_roles' })
  permissions!: Relation<PermissionSchema[]>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;
}
