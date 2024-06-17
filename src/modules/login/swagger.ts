import { LoginInput } from '@/core/user/use-cases/user-login';
import { Swagger } from '@/utils/docs/swagger';

const BASE_URL = `api/v1/login`;

export const SwaggerResponse = {
  login: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: { token: '<token>' },
      description: 'user logged.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: BASE_URL,
      message: 'userNotFound',
      description: 'username or password not found.'
    })
  }
};

export const SwaggerRequest = {
  login: Swagger.defaultRequestJSON({
    email: 'admin@admin.com',
    password: 'admin'
  } as LoginInput)
};
