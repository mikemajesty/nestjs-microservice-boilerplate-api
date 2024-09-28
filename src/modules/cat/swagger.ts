import { CatRequest } from '@/utils/docs/data/cat/request';
import { CatResponse } from '@/utils/docs/data/cat/response';
import { Swagger } from '@/utils/docs/swagger';
import { ApiNotFoundException } from '@/utils/exception';

const BASE_URL = `api/v1/cats`;

export const SwaggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: CatResponse.create,
      description: 'create user.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: CatResponse.update,
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
      json: CatResponse.getById,
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
      json: CatResponse.delete,
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
      json: CatResponse.list,
      description: 'cat created.'
    })
  }
};

export const SwaggerRequest = {
  create: Swagger.defaultRequestJSON(CatRequest.create),
  update: Swagger.defaultRequestJSON(CatRequest.update),
  list: Swagger.defaultRequestListJSON()
};
