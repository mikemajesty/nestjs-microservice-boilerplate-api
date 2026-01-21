/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/repository.md
 */
import { IRepository } from '@/infra/repository'

import { PermissionEntity } from '../entity/permission'
import { PermissionListInput, PermissionListOutput } from '../use-cases/permission-list'

export type ExistsOnUpdateInput = {
  idNotEquals: string
  nameEquals: string
}

export abstract class IPermissionRepository extends IRepository<PermissionEntity> {
  abstract paginate(input: PermissionListInput): Promise<PermissionListOutput>
}
