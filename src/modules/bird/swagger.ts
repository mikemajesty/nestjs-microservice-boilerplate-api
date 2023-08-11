import { CreatedModel } from '@/infra/repository/types';
import { Swagger } from '@/utils/swagger';

const entity = {
  name: '<name>'
};

const entityFull = { ...entity, updatedAt: '<updatedAt>', createdAt: '<createdAt>', deletedAt: '<deletedAt>' };

export const SwagggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: { created: true, id: '<uuid>' } as CreatedModel,
      description: 'bird created.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: entityFull,
      description: 'bird updated.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/birds',
      message: 'birdNotFound',
      description: 'bird not found.'
    })
  },
  getByID: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: entityFull,
      description: 'bird found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/birds/:id',
      message: 'birdNotFound',
      description: 'bird not found.'
    })
  },
  delete: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: entityFull,
      description: 'bird found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/birdss/:id',
      message: 'birdNotFound',
      description: 'bird not found.'
    })
  },
  list: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: { docs: { docs: [entityFull], page: 1, limit: 1, total: 1 } },
      description: 'bird created.'
    })
  }
};

export const SwagggerRequest = {
  createBody: Swagger.defaultRequestJSON({ ...entity, id: undefined }),
  updateBody: Swagger.defaultRequestJSON({ ...entity, id: '<id>' }),
  listQuery: {
    pagination: {
      limit: Swagger.defaultApiQueryOptions({ example: 10, name: 'limit', required: false }),
      page: Swagger.defaultApiQueryOptions({ example: 1, name: 'page', required: false })
    },
    sort: Swagger.defaultApiQueryOptions({
      name: 'sort',
      required: false,
      description: '<b>createdAt:desc,name:asc'
    }),
    search: Swagger.defaultApiQueryOptions({
      name: 'search',
      required: false,
      description: '<b>name:miau'
    })
  }
};
