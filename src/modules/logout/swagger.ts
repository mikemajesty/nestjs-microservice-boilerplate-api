import { Swagger } from '@/utils/docs/swagger';

export const SwaggerResponse = {
  logout: {
    200: Swagger.defaultResponseJSON({
      status: 401,
      json: undefined,
      description: 'user logout'
    })
  }
};

export const SwagggerRequest = {
  body: Swagger.defaultRequestJSON({
    token: '<token>'
  })
};
