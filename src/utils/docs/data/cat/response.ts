import { CatEntity } from '@/core/cat/entity/cat';
import { CatCreateOutput } from '@/core/cat/use-cases/cat-create';
import { CatDeleteOutput } from '@/core/cat/use-cases/cat-delete';
import { CatGetByIdOutput } from '@/core/cat/use-cases/cat-get-by-id';
import { CatListOutput } from '@/core/cat/use-cases/cat-list';
import { CatUpdateOutput } from '@/core/cat/use-cases/cat-update';
import { getMockDate, getMockUUID } from '@/utils/tests';

const entity = {
  id: getMockUUID(),
  name: 'Miau',
  breed: 'breed',
  age: 1
} as CatEntity;

const fullEntity = {
  ...entity,
  createdAt: getMockDate(),
  updatedAt: getMockDate(),
  deletedAt: null
} as CatEntity;

export const CatResponse = {
  create: { created: true, id: getMockUUID() } as CatCreateOutput,
  delete: { ...fullEntity, deletedAt: getMockDate() } as CatDeleteOutput,
  update: fullEntity as CatUpdateOutput,
  getById: fullEntity as CatGetByIdOutput,
  list: { docs: [fullEntity], limit: 10, page: 1, total: 1 } as CatListOutput
};
