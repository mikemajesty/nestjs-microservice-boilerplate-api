/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/decorators/request-timeout.md
 */
import { CustomDecorator, SetMetadata } from '@nestjs/common'

import { ApiUnprocessableEntityException } from '../exception'

export const REQUEST_TIMEOUT_METADATA_KEY = 'request-timeout'

export const RequestTimeout = (milliseconds: number): CustomDecorator<string> => {
  if (!Number.isInteger(milliseconds) || milliseconds <= 0) {
    throw new ApiUnprocessableEntityException('Request timeout must be a positive integer in milliseconds')
  }

  return SetMetadata(REQUEST_TIMEOUT_METADATA_KEY, milliseconds)
}
