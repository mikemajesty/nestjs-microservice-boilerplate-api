/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/libs/token.md
 */
import { Injectable } from '@nestjs/common'
import jwt from 'jsonwebtoken'

import { UserEntitySchema } from '@/core/user/entity/user'
import { ISecretsAdapter } from '@/infra/secrets'
import { ApiUnauthorizedException } from '@/utils/exception'
import { InputValidator } from '@/utils/validator'

import { ITokenAdapter } from './adapter'

export const TokenGetSchema = UserEntitySchema.pick({
  email: true,
  roles: true
}).and(InputValidator.object({ password: InputValidator.string() }))

@Injectable()
export class TokenService implements ITokenAdapter {
  constructor(private readonly secret: ISecretsAdapter) {}

  sign(input: TokenSignInput): TokenSignOutput {
    const token = jwt.sign(
      input.body as jwt.JwtPayload,
      input.secret ?? this.secret.JWT_SECRET_KEY,
      input.options || {
        expiresIn: this.secret.TOKEN_EXPIRATION as jwt.SignOptions['expiresIn']
      }
    )

    return { token }
  }

  async verify<T>(input: TokenVerifyInput): Promise<T> {
    return new Promise((res, rej) => {
      jwt.verify(input.token, input.secret ?? this.secret.JWT_SECRET_KEY, (error, decoded) => {
        if (error) rej(new ApiUnauthorizedException(error.message))

        res(decoded as T)
      })
    })
  }
}

export type TokenSignInput = {
  secret?: string
  body: unknown
  options?: jwt.SignOptions
}

export type TokenSignOutput = {
  token: string
}

export type TokenVerifyInput = {
  secret?: string
  token: string
}
