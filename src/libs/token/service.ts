/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/libs/token.md
 */
import { Injectable } from '@nestjs/common'
import jwt from 'jsonwebtoken'

import { UserEntitySchema } from '@/core/user/entity/user'
import { ISecretsAdapter } from '@/infra/secrets'
import { ApiUnauthorizedException } from '@/utils/exception'
import { Schema } from '@/utils/schema'

import { ITokenAdapter } from './adapter'

export const TokenGetSchema = UserEntitySchema.pick({
  email: true,
  roles: true
}).and(Schema.object({ password: Schema.string() }))

const TOKEN_ALGORITHM: jwt.Algorithm = 'HS256'

@Injectable()
export class TokenService implements ITokenAdapter {
  constructor(private readonly secret: ISecretsAdapter) {}

  get refreshSecret(): string {
    return this.secret.JWT_REFRESH_SECRET_KEY
  }

  get refreshExpiration(): number {
    return this.secret.REFRESH_TOKEN_EXPIRATION
  }

  sign(input: TokenSignInput): TokenSignOutput {
    const token = jwt.sign(input.body as jwt.JwtPayload, input.secret ?? this.secret.JWT_SECRET_KEY, {
      expiresIn: this.secret.TOKEN_EXPIRATION as jwt.SignOptions['expiresIn'],
      ...input.options,
      algorithm: TOKEN_ALGORITHM
    })

    return { token }
  }

  async verify<T>(input: TokenVerifyInput): Promise<T> {
    return new Promise((res, rej) => {
      jwt.verify(
        input.token,
        input.secret ?? this.secret.JWT_SECRET_KEY,
        { algorithms: [TOKEN_ALGORITHM] },
        (error, decoded) => {
          if (error) return rej(new ApiUnauthorizedException(error.message))

          res(decoded as T)
        }
      )
    })
  }

  decode<T>(input: TokenDecodeInput): T {
    return jwt.decode(input.token) as T
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

export type TokenDecodeInput = {
  token: string
}
