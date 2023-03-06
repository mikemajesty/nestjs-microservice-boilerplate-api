import { Max, Min } from 'class-validator';
import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'cats' })
export class CatsSchema extends BaseEntity {
  @Column({ type: 'uuid', primary: true })
  id: string;

  @Column('text')
  @Min(1)
  @Max(200)
  name: string;

  @Column('text')
  @Min(1)
  @Max(200)
  breed: string;

  @Column('int')
  @Min(0)
  @Max(30)
  age: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}
