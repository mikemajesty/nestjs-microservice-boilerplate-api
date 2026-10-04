/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/libs/token.md
 */
import { TokenDecodeInput, TokenSignInput, TokenSignOutput, TokenVerifyInput } from './service'

export abstract class ITokenAdapter {
  abstract refreshSecret: string
  abstract sign(input: TokenSignInput): TokenSignOutput
  abstract verify<T>(input: TokenVerifyInput): Promise<NoInfer<T>>
  abstract decode<T>(input: TokenDecodeInput): T
}
