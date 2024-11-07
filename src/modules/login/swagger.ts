import { LoginInput, LoginOutput } from '@/core/user/use-cases/user-login';
import { RefreshTokenInput, RefreshTokenOutput } from '@/core/user/use-cases/user-refresh-token';
import { Swagger } from '@/utils/docs/swagger';

const BASE_URL = `api/v1`;

export const SwaggerResponse = {
  login: {
    200: Swagger.defaultResponseJSON<LoginOutput>({
      status: 200,
      json: { accessToken: '<token>', refreshToken: '<token>' },
      description: 'user login.'
    }),
    404: Swagger.defaultResponseWithMultiplesError({
      messages: {
        'user not found': { value: ['userNotFound'], description: 'user not found' },
        'role not found': { value: ['roleNotFound'], description: 'user role not found' }
      },
      route: BASE_URL.concat('/login'),
      status: 404
    })
  },
  refresh: {
    200: Swagger.defaultResponseJSON<RefreshTokenOutput>({
      status: 200,
      json: { accessToken: '<token>', refreshToken: '<token>' },
      description: 'user refresh token.'
    }),
    404: Swagger.defaultResponseWithMultiplesError({
      messages: {
        'user not found': { value: ['userNotFound'], description: 'user not found' },
        'role not found': { value: ['roleNotFound'], description: 'user role not found' }
      },
      route: BASE_URL.concat('/refresh'),
      status: 404
    })
  }
};

export const SwaggerRequest = {
  login: Swagger.defaultRequestJSON<LoginInput>({
    email: 'admin@admin.com',
    password: 'admin'
  }),
  refresh: Swagger.defaultRequestJSON<RefreshTokenInput>({
    refreshToken: '<token>'
  })
};
