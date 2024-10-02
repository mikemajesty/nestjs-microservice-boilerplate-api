import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { UserEntitySchema } from '@/core/user/entity/user';
import { ISecretsAdapter } from '@/infra/secrets';
import { ApiUnauthorizedException } from '@/utils/exception';

import { ITokenAdapter } from './adapter';

export const Schema = UserEntitySchema.pick({
  email: true,
  roles: true
}).merge(z.object({ password: z.string() }));

export type SignInput = z.infer<typeof Schema>;

export type SignOutput = {
  token: string;
};

@Injectable()
export class TokenService implements ITokenAdapter {
  constructor(private readonly secret: ISecretsAdapter) {}

  sign(model: SignInput, options?: jwt.SignOptions): SignOutput {
    const token = jwt.sign(
      model,
      this.secret.JWT_SECRET_KEY,
      options || {
        expiresIn: this.secret.TOKEN_EXPIRATION as string
      }
    );

    return { token };
  }

  async verify<T>(token: string): Promise<T> {
    return new Promise((res, rej) => {
      jwt.verify(token, this.secret.JWT_SECRET_KEY, (error, decoded) => {
        if (error) rej(new ApiUnauthorizedException(error.message));

        res(decoded as T);
      });
    });
  }
}
