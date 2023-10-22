import { CatsEntity } from '@/core/cats/entity/cats';

export class CatsResponseMock {
  static readonly catMock = new CatsEntity({
    age: 10,
    breed: 'dummy',
    name: 'dummy'
  });

  static readonly catsMock = [
    new CatsEntity({
      ...this.catMock,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    })
  ];
}
