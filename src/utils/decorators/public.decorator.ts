import { SetMetadata } from '@nestjs/common'

export const PUBLIC_GUARD = 'public'
export const Public = (isPublic = true) => SetMetadata(PUBLIC_GUARD, isPublic)
