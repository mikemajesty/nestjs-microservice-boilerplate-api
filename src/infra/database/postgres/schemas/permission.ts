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

import { RoleSchema } from './role';

@Entity({ name: 'permissions' })
export class PermissionSchema extends BaseEntity {
  @Column({ type: 'uuid', primary: true })
  id!: string;

  @Column('text', { unique: true })
  name!: string;

  @ManyToMany(() => RoleSchema)
  @JoinTable({ name: 'permissions_roles' })
  roles!: Relation<RoleSchema[]>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;
}
