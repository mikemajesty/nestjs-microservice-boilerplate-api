import { CatsEntity } from '@/core/cats/entity/cats';
import { CatsCreateOutput } from '@/core/cats/use-cases/cats-create';
import { CatsDeleteOutput } from '@/core/cats/use-cases/cats-delete';
import { CatsGetByIdOutput } from '@/core/cats/use-cases/cats-get-by-id';
import { CatsListOutput } from '@/core/cats/use-cases/cats-list';
import { CatsUpdateOutput } from '@/core/cats/use-cases/cats-update';
import { getMockDate, getMockUUID } from '@/utils/tests';

const entity = {
  name: 'Miau',
  breed: 'breed',
  age: 1
} as CatsEntity;

const fullEntity = {
  ...entity,
  createdAt: getMockDate(),
  updatedAt: getMockDate(),
  deletedAt: null
} as CatsEntity;

export const CatsResponse = {
  create: { created: true, id: getMockUUID() } as CatsCreateOutput,
  delete: { ...fullEntity, deletedAt: getMockDate() } as CatsDeleteOutput,
  update: fullEntity as CatsUpdateOutput,
  getByID: fullEntity as CatsGetByIdOutput,
  list: { docs: [fullEntity], limit: 10, page: 1, total: 1 } as CatsListOutput
};
