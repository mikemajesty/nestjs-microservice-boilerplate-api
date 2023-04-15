import { Column, Model, Table } from 'sequelize-typescript';

@Table({ timestamps: true, tableName: 'cats' })
export class CatSchema extends Model {
  @Column
  name: string;

  @Column
  age: number;

  @Column
  breed: string;

  @Column
  deletedAt?: Date;
}
