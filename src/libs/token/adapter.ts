/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/libs/token.md
 */
import { SignOutput } from './service';

export abstract class ITokenAdapter {
  abstract sign<T>(model: object, options?: T): SignOutput
  abstract verify<T = void>(token: string): Promise<NoInfer<T>>
}
