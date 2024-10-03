import { ResetPasswordConfirmInput } from '@/core/reset-password/use-cases/reset-password-confirm';
import { ResetPasswordSendEmailInput } from '@/core/reset-password/use-cases/reset-password-send-email';
import { Swagger } from '@/utils/docs/swagger';

const BASE_URL = 'api/v1/reset-password';

export const SwaggerResponse = {
  sendEmail: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      description: 'email sended.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/send-email`,
      message: 'user not found',
      description: 'username or passwrd is incorrect.'
    })
  },
  confirm: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      description: 'password changed successfully.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: `${BASE_URL}/:token`,
      message: 'user not found',
      description: 'user not found.'
    }),
    401: Swagger.defaultResponseError({
      status: 401,
      route: `${BASE_URL}/:token`,
      message: 'token was expired',
      description: 'token was expired.'
    }),
    400: Swagger.defaultResponseWithMultiplesError({
      status: 400,
      route: `${BASE_URL}/:token`,
      messages: {
        'different passwords': {
          value: ['passwords are different'],
          description: 'Password is different from confirmPassword'
        },
        'input validation': {
          value: ['password: required', 'confirmPassword: required'],
          description: 'Input validators'
        }
      },
      description: 'validator errors.'
    })
  }
};

export const SwaggerRequest = {
  sendEmail: Swagger.defaultRequestJSON({
    email: 'admin@admin.com'
  } as ResetPasswordSendEmailInput),
  confirmResetPassword: Swagger.defaultRequestJSON({
    confirmPassword: '*****',
    password: '*****'
  } as ResetPasswordConfirmInput)
};
