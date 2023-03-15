import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import { ISecretsAdapter } from '@/infra/secrets';
import { ApiUnauthorizedException } from '@/utils/exception';

import { ITokenAdapter } from './adapter';
import { AuthInput, AuthOutput } from './types';

type DecodeOutput = {
  password: string;
};

@Injectable()
export class TokenService implements ITokenAdapter {
  constructor(private readonly secret: ISecretsAdapter) {}

  sign(model: AuthInput, options?: jwt.SignOptions): AuthOutput {
    const token = jwt.sign(
      model,
      model.password,
      options || {
        expiresIn: this.secret.TOKEN_EXPIRATION
      }
    );

    return { token };
  }

  async verify(token: string): Promise<jwt.JwtPayload | string> {
    const tokenData = this.decode(token);

    return new Promise((res, rej) => {
      jwt.verify(token, tokenData?.password, (error, decoded) => {
        if (error) rej(new ApiUnauthorizedException(error.message));

        res(decoded);
      });
    });
  }

  decode(token: string): DecodeOutput {
    return jwt.decode(token) as unknown as DecodeOutput;
  }
}
