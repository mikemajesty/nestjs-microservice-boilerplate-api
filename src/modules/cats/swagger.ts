import { CreatedModel } from '@/infra/repository/types';
import { Swagger } from '@/utils/swagger';

const entity = {
  name: '<name>',
  breed: '<breed>',
  age: 1
};

const entityFull = { ...entity, updatedAt: '<updatedAt>', createdAt: '<createdAt>', deletedAt: '<deletedAt>' };

export const SwagggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: { created: true, id: '<uuid>' } as CreatedModel,
      description: 'cat created.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: entityFull,
      description: 'cat updated.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/cats',
      message: 'catNotFound',
      description: 'cat not found.'
    })
  },
  getByID: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: entityFull,
      description: 'cat found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/cats/:id',
      message: 'catNotFound',
      description: 'cat not found.'
    })
  },
  delete: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: entityFull,
      description: 'cat found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/cats/:id',
      message: 'catNotFound',
      description: 'cat not found.'
    })
  },
  list: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: { docs: { docs: [entityFull], page: 1, limit: 1, total: 1 } },
      description: 'cat created.'
    })
  }
};

export const SwagggerRequest = {
  createBody: Swagger.defaultRequestJSON({ ...entity, id: undefined }),
  updateBody: Swagger.defaultRequestJSON({ ...entity, id: '<id>' }),
  listQuery: Swagger.defaultApiQueryOptions({ example: 'limit=10&page=1', name: 'pagination', required: false })
};
