import { Swagger } from '@/utils/swagger';

export const SwagggerResponse = {
  login: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: { token: '<token>' },
      description: 'user logged'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/login',
      message: 'userNotFound',
      description: 'username or password not found.'
    })
  }
};

export const SwagggerRequest = {
  body: Swagger.defaultRequestJSON({
    login: 'admin',
    password: 'admin'
  })
};
