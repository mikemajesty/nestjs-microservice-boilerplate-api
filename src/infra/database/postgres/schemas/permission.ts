import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'permissions' })
export class PermissionSchema extends BaseEntity {
  @Column({ type: 'uuid', primary: true })
  id: string;

  @Column('text', { unique: true })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}
