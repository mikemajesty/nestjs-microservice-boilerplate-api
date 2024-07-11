import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  Relation,
  UpdateDateColumn
} from 'typeorm';

import { RoleSchema } from './role';
import { UserPasswordSchema } from './userPassword';

@Entity({ name: 'users' })
@Index(['email', 'deletedAt'], { unique: true })
export class UserSchema extends BaseEntity {
  @Column({ type: 'uuid', primary: true })
  id: string;

  @Column('text')
  name: string;

  @Column('text')
  email: string;

  @OneToOne(() => UserPasswordSchema, { cascade: ['insert', 'recover', 'update', 'remove', 'soft-remove'] })
  @JoinColumn()
  password: Relation<UserPasswordSchema>;

  @ManyToOne(() => RoleSchema, { cascade: ['insert', 'recover', 'update'] })
  @JoinColumn()
  role: Relation<RoleSchema>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}
