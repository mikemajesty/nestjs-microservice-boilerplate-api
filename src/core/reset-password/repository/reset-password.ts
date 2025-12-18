/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/main/guides/core/repository.md
 */
import { IRepository } from '@/infra/repository'

import { ResetPasswordEntity } from '../entity/reset-password'

export abstract class IResetPasswordRepository extends IRepository<ResetPasswordEntity> {
  abstract findByIdUserId(id: string): Promise<ResetPasswordEntity>
}
