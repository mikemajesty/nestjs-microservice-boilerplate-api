import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'cats' })
export class CatsSchema extends BaseEntity {
  @Column({ type: 'uuid', primary: true })
  id: string;

  @Column('text')
  name: string;

  @Column('int')
  age: number;

  @Column('text')
  breed: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}
