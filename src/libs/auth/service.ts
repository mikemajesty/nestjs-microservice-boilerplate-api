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
      this.secret.JWT_SECRET_KEY,
      options || {
        expiresIn: this.secret.TOKEN_EXPIRATION
      }
    );

    return { token };
  }

  async verify(token: string): Promise<jwt.JwtPayload | string> {
    return new Promise((res, rej) => {
      jwt.verify(token, this.secret.JWT_SECRET_KEY, (error, decoded) => {
        if (error) rej(new ApiUnauthorizedException(error.message));

        res(decoded);
      });
    });
  }

  decode(token: string, complete?: boolean): DecodeOutput {
    return jwt.decode(token, { complete }) as unknown as DecodeOutput;
  }
}
