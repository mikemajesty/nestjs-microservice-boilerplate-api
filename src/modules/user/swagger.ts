import { UsersRequest } from '@/utils/docs/data/user/request';
import { UsersResponse } from '@/utils/docs/data/user/response';
import { Swagger } from '@/utils/docs/swagger';

const BASE_URL = `api/v1/users`;

export const SwaggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: UsersResponse.create,
      description: 'user created.'
    }),
    409: Swagger.defaultResponseError({
      status: 409,
      route: BASE_URL,
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
      route: BASE_URL,
      message: 'userNotFound',
      description: 'user not found.'
    }),
    409: Swagger.defaultResponseError({
      status: 409,
      route: BASE_URL,
      message: 'userExists',
      description: 'user exists.'
    })
  },
  getById: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: UsersResponse.getById,
      description: 'user found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/:id`,
      message: 'userNotFound',
      description: 'user not found.'
    })
  },
  changePassword: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      description: 'change password successfully.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/change-password/:id`,
      message: 'userNotFound',
      description: 'user not found.'
    }),
    400: Swagger.defaultResponseWithMultiplesError({
      status: 400,
      route: `${BASE_URL}/change-password/:id`,
      messages: {
        'password is incorrect': { description: 'password is incorrect', value: ['passwordIsIncorrect'] },
        'password is different': { description: 'new password is different', value: ['passwordIsDifferent'] }
      },
      description: 'change password.'
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
      route: `${BASE_URL}/:id`,
      message: 'userNotFound',
      description: 'user not found.'
    })
  },
  me: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: UsersResponse.me,
      description: 'user jwt data.'
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
  create: Swagger.defaultRequestJSON(UsersRequest.create),
  update: Swagger.defaultRequestJSON(UsersRequest.update),
  changePassword: Swagger.defaultRequestJSON(UsersRequest.changePassword),
  list: Swagger.defaultRequestListJSON()
};
