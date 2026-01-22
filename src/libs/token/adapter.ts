/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/libs/token.md
 */
import { TokenSignInput, TokenSignOutput, TokenVerifyInput } from './service'

export abstract class ITokenAdapter {
  abstract sign(input: TokenSignInput): TokenSignOutput
  abstract verify<T = void>(input: TokenVerifyInput): Promise<NoInfer<T>>
}
