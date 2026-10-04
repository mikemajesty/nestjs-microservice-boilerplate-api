/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { IPermissionRepository } from '@/core/permission/repository/permission'
import { RoleEntity } from '@/core/role/entity/role'
import { ICacheAsideAdapter } from '@/infra/cache/aside'
import { ILoggerAdapter } from '@/infra/logger'
import { ValidateSchema } from '@/utils/decorators'
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception'
import { Namespaces } from '@/utils/namespaces'
import { IUsecase } from '@/utils/usecase'
import { SchemaInfer } from '@/utils/validator'

import { PermissionEntity, PermissionEntitySchema } from './../entity/permission'

export const PermissionUpdateSchema = PermissionEntitySchema.pick({
  id: true
}).and(PermissionEntitySchema.pick({ name: true }).partial())

export class PermissionUpdateUsecase implements IUsecase {
  constructor(
    private readonly permissionRepository: IPermissionRepository,
    private readonly loggerService: ILoggerAdapter,
    private readonly cacheAside: ICacheAsideAdapter
  ) {}

  @ValidateSchema(PermissionUpdateSchema)
  async execute(input: PermissionUpdateInput): Promise<PermissionUpdateOutput> {
    const permission = await this.permissionRepository.findOneWithRelation({ id: input.id }, { roles: true })

    if (!permission) {
      throw new ApiNotFoundException('permissionNotFound')
    }

    const roleCacheKeys = (permission.roles as RoleEntity[]).map((role) => Namespaces.roleById(role.id))

    if (input.name) {
      const permissionExists = await this.permissionRepository.existsOnUpdate(
        {
          name: input.name
        },
        input.id
      )

      if (permissionExists) {
        throw new ApiConflictException('permissionExists')
      }
    }

    const entity = new PermissionEntity(permission)
    entity.merge(input)

    entity.removeAllRoles()

    await this.permissionRepository.updateOne({ id: entity.id }, entity.toObject())

    if (input.name) {
      await this.cacheAside.invalidateMany(roleCacheKeys)
    }

    this.loggerService.info({ message: 'permission updated.', metadata: { permission: input } })

    return entity.toObject()
  }
}

export type PermissionUpdateInput = SchemaInfer<typeof PermissionUpdateSchema>
export type PermissionUpdateOutput = PermissionEntity
