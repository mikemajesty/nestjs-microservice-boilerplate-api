import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'birds' })
export class BirdSchema extends BaseEntity {
  @Column({ type: 'uuid', primary: true })
  id!: string

  @Column('text')
  name!: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date
}
