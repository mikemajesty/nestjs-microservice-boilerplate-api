/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { IPermissionRepository } from '@/core/permission/repository/permission'
import { RoleEntity } from '@/core/role/entity/role'
import { ValidateSchema } from '@/utils/decorators'
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception'
import { IUsecase } from '@/utils/usecase'
import { SchemaInfer } from '@/utils/validator'

import { PermissionEntity, PermissionEntitySchema } from '../entity/permission'

export const PermissionDeleteSchema = PermissionEntitySchema.pick({
  id: true
})

export class PermissionDeleteUsecase implements IUsecase {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  @ValidateSchema(PermissionDeleteSchema)
  async execute({ id }: PermissionDeleteInput): Promise<PermissionDeleteOutput> {
    const permission = await this.permissionRepository.findOneWithRelation({ id }, { roles: true })

    if (!permission) {
      throw new ApiNotFoundException('permissionNotFound')
    }

    if (permission.roles?.length) {
      throw new ApiConflictException(
        `permissionHasAssociationWithRole: ${(permission.roles as RoleEntity[]).map((r) => r.name).join(', ')}`
      )
    }

    permission.deactivate()

    await this.permissionRepository.create(permission.toData())

    return permission.toData()
  }
}

export type PermissionDeleteInput = SchemaInfer<typeof PermissionDeleteSchema>
export type PermissionDeleteOutput = PermissionEntity
