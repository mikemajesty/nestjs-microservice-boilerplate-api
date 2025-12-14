import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, Index, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'users_password' })
@Index('idx_users_password_not_deleted', ['id'], {
  where: '"deleted_at" IS NULL'
})
export class UserPasswordSchema extends BaseEntity {
  @Column({ type: 'uuid', primary: true })
  id!: string

  @Column('text')
  password!: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date
}
