import { Swagger } from '@/utils/docs/swagger';

export const SwaggerResponse = {
  logout: {
    401: Swagger.defaultResponseJSON({
      status: 401,
      description: 'user logout'
    })
  }
};

export const SwaggerRequest = {
  logout: Swagger.defaultRequestJSON({
    token: '<token>'
  })
};
