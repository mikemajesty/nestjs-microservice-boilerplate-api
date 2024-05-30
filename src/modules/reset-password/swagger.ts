import { ConfirmResetPasswordInput } from '@/core/reset-password/use-cases/confirm';
import { SendEmailResetPasswordInput } from '@/core/reset-password/use-cases/send-email';
import { Swagger } from '@/utils/docs/swagger';

export const SwaggerResponse = {
  sendEmail: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      description: 'email sended.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/v1/reset-password/send-email',
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
      route: 'api/v1/reset-password/:token',
      message: 'user not found',
      description: 'user not found.'
    }),
    401: Swagger.defaultResponseError({
      status: 401,
      route: 'api/v1/reset-password/:token',
      message: 'token was expired',
      description: 'token was expired.'
    }),
    400: Swagger.defaultResponseWithMultiplesError({
      status: 400,
      route: 'api/v1/reset-password/:token',
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
      description: 'token was expired.'
    })
  }
};

export const SwaggerRequest = {
  sendEmailBody: Swagger.defaultRequestJSON({
    email: 'admin@admin.com'
  } as SendEmailResetPasswordInput),
  confirmResetPassword: Swagger.defaultRequestJSON({
    confirmPassword: '*****',
    password: '*****'
  } as ConfirmResetPasswordInput)
};
