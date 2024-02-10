import { CatsEntity } from '@/core/cats/entity/cats';
import { CatsCreateOutput } from '@/core/cats/use-cases/cats-create';
import { CatsDeleteOutput } from '@/core/cats/use-cases/cats-delete';
import { CatsGetByIdOutput } from '@/core/cats/use-cases/cats-get-by-id';
import { CatsListOutput } from '@/core/cats/use-cases/cats-list';
import { CatsUpdateOutput } from '@/core/cats/use-cases/cats-update';
import { GET_MOCK_DATE } from '@/utils/tests/mocks/date';
import { getMockUUID } from '@/utils/tests/tests';

const entity = new CatsEntity({
  name: 'Miau',
  breed: 'breed',
  age: 1
});

const fullEntity = new CatsEntity({
  ...entity,
  createdAt: GET_MOCK_DATE,
  updatedAt: GET_MOCK_DATE,
  deletedAt: null
});

export const CatsResponse = {
  create: { created: true, id: getMockUUID() } as CatsCreateOutput,
  delete: { ...fullEntity, deletedAt: GET_MOCK_DATE } as CatsDeleteOutput,
  update: fullEntity as CatsUpdateOutput,
  getByID: fullEntity as CatsGetByIdOutput,
  list: { docs: [fullEntity], limit: 10, page: 1, total: 1 } as CatsListOutput
};
