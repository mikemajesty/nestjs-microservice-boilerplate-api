/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { PermissionEntity } from '@/core/permission/entity/permission'
import { ValidateSchema } from '@/utils/decorators'
import { PaginationInput, PaginationOutput, PaginationSchema } from '@/utils/pagination'
import { Schema } from '@/utils/schema'
import { SearchSchema } from '@/utils/search'
import { SortSchema } from '@/utils/sort'
import { IUsecase } from '@/utils/usecase'

import { IPermissionRepository } from '../repository/permission'

export const PermissionListSchema = Schema.intersection(PaginationSchema, SortSchema.and(SearchSchema))

export class PermissionListUsecase implements IUsecase {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  @ValidateSchema(PermissionListSchema)
  async execute(input: PermissionListInput): Promise<PermissionListOutput> {
    return await this.permissionRepository.paginate(input)
  }
}

export type PermissionListInput = PaginationInput<PermissionEntity>
export type PermissionListOutput = PaginationOutput<PermissionEntity>
