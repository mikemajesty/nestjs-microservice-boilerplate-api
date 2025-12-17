/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/decorators/request-timeout.md
 */
import { CustomDecorator, SetMetadata } from '@nestjs/common'

export const RequestTimeout = (milliseconds: number): CustomDecorator<string> => {
  return SetMetadata('request-timeout', milliseconds)
}
