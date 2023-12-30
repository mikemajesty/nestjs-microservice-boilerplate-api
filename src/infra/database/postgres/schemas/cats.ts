import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ timestamps: true, tableName: 'cats', underscored: true })
export class CatsSchema extends Model {
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @Column(DataType.STRING)
  name: string;

  @Column(DataType.INTEGER)
  age: number;

  @Column(DataType.STRING)
  breed: string;

  @Column({ allowNull: true, type: DataType.DATE })
  deletedAt?: Date;
}
