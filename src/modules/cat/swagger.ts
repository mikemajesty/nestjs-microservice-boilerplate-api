import { CatsRequest } from '@/utils/docs/data/cat/request';
import { CatsResponse } from '@/utils/docs/data/cat/response';
import { Swagger } from '@/utils/docs/swagger';
import { ApiNotFoundException } from '@/utils/exception';

const BASE_URL = `api/v1/cats`;

export const SwaggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: CatsResponse.create,
      description: 'create user.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: CatsResponse.update,
      description: 'update user.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: BASE_URL,
      message: ApiNotFoundException.name,
      description: 'cat not found.'
    })
  },
  getById: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: CatsResponse.getById,
      description: 'cat founded.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/:id`,
      message: ApiNotFoundException.name,
      description: 'cat not found.'
    })
  },
  delete: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: CatsResponse.delete,
      description: 'cat deleted.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/:id`,
      message: ApiNotFoundException.name,
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

export const SwaggerRequest = {
  create: Swagger.defaultRequestJSON(CatsRequest.create),
  update: Swagger.defaultRequestJSON(CatsRequest.update),
  list: {
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
      description: `<b>propertyName1:value,propertyName2:value`
    })
  }
};
