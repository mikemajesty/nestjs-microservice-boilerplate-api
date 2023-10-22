import { CatsRequest } from '@/utils/docs/data/cats/request';
import { CatsResponse } from '@/utils/docs/data/cats/response';
import { Swagger } from '@/utils/docs/swagger';

export const SwagggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: CatsResponse.create,
      description: 'cat created.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: CatsResponse.update,
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
      json: CatsResponse.getByID,
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
      json: CatsResponse.delete,
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
      json: CatsResponse.list,
      description: 'cat created.'
    })
  }
};

export const SwagggerRequest = {
  createBody: Swagger.defaultRequestJSON(CatsRequest.create),
  updateBody: Swagger.defaultRequestJSON(CatsRequest.update),
  listQuery: {
    pagination: {
      limit: Swagger.defaultApiQueryOptions({ example: 10, name: 'limit', required: false }),
      page: Swagger.defaultApiQueryOptions({ example: 1, name: 'page', required: false })
    },
    sort: Swagger.defaultApiQueryOptions({
      name: 'sort',
      required: false,
      description: `<b>createdAt:desc,name:asc`
    }),
    search: Swagger.defaultApiQueryOptions({
      name: 'search',
      required: false,
      description: `<b>name:miau,breed:siamese`
    })
  }
};
