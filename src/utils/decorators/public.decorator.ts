/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/decorators/public.md
 */
import { SetMetadata } from '@nestjs/common'

export const PUBLIC_GUARD = 'public'
export const Public = (isPublic = true) => SetMetadata(PUBLIC_GUARD, isPublic)
