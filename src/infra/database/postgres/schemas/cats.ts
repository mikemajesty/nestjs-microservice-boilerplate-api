import { Column, Length, Max, Min, Model, Table } from 'sequelize-typescript';

@Table({ timestamps: true, tableName: 'cats' })
export class CatSchema extends Model {
  @Length({ max: 200, min: 1 })
  @Column
  name: string;

  @Max(30)
  @Min(1)
  @Column
  age: number;

  @Length({ max: 200, min: 1 })
  @Column
  breed: string;

  @Column
  deletedAt?: Date;
}
