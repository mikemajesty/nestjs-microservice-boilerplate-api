import { CatsEntity } from '@/core/cat/entity/cats';
import { CatsCreateOutput } from '@/core/cat/use-cases/cats-create';
import { CatsDeleteOutput } from '@/core/cat/use-cases/cats-delete';
import { CatsGetByIdOutput } from '@/core/cat/use-cases/cats-get-by-id';
import { CatsListOutput } from '@/core/cat/use-cases/cats-list';
import { CatsUpdateOutput } from '@/core/cat/use-cases/cats-update';
import { getMockDate, getMockUUID } from '@/utils/tests';

const entity = {
  id: getMockUUID(),
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
  getById: fullEntity as CatsGetByIdOutput,
  list: { docs: [fullEntity], limit: 10, page: 1, total: 1 } as CatsListOutput
};
