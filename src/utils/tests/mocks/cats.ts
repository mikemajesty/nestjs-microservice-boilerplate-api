import { CatsEntity } from '@/core/cats/entity/cats';

import { generateUUID } from '../tests';

export class CatsMock {
  static catCreateMock = {
    age: 10,
    breed: 'dummy',
    name: 'dummy'
  } as CatsEntity;

  static catResponseMock = {
    id: generateUUID(),
    ...this.catCreateMock
  } as CatsEntity;

  static catsResponseMock = {
    ...this.catResponseMock,
    createdAt: new Date(),
    updatedAt: new Date()
  } as CatsEntity;
}
