import { UsersRequest } from '@/utils/docs/data/user/request';
import { UsersResponse } from '@/utils/docs/data/user/response';
import { Swagger } from '@/utils/docs/swagger';

export const SwaggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: UsersResponse.create,
      description: 'user created.'
    }),
    409: Swagger.defaultResponseError({
      status: 409,
      route: 'api/users',
      message: 'userExists',
      description: 'user exists.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: UsersResponse.update,
      description: 'user updated.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/users',
      message: 'userNotFound',
      description: 'user not found.'
    }),
    409: Swagger.defaultResponseError({
      status: 409,
      route: 'api/users',
      message: 'userExists',
      description: 'user exists.'
    })
  },
  getByID: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: UsersResponse.getByID,
      description: 'user found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/users/:id',
      message: 'userNotFound',
      description: 'user not found.'
    })
  },
  delete: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: UsersResponse.delete,
      description: 'user found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/users/:id',
      message: 'userNotFound',
      description: 'user not found.'
    })
  },
  list: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: UsersResponse.list,
      description: 'user created.'
    })
  }
};

export const SwaggerRequest = {
  createBody: Swagger.defaultRequestJSON(UsersRequest.create),
  updateBody: Swagger.defaultRequestJSON(UsersRequest.update),
  listQuery: {
    pagination: {
      limit: Swagger.defaultApiQueryOptions({ example: 10, name: 'limit', required: false }),
      page: Swagger.defaultApiQueryOptions({ example: 1, name: 'page', required: false })
    },
    sort: Swagger.defaultApiQueryOptions({
      name: 'sort',
      required: false,
      description: `<b>createdAt:desc,login:asc`
    }),
    search: Swagger.defaultApiQueryOptions({
      name: 'search',
      required: false,
      description: `<b>login:value<login>`
    })
  }
};
