import { CatsEntity } from '@/core/cats/entity/cats';

import { generateUUID } from '../tests';

export const catCreateMock = {
  age: 10,
  breed: 'dummy',
  name: 'dummy'
} as CatsEntity;

export const catResponseMock = {
  id: generateUUID(),
  ...catCreateMock
} as CatsEntity;

export const catsResponseMock = {
  ...catResponseMock,
  createdAt: new Date(),
  updatedAt: new Date()
} as CatsEntity;
