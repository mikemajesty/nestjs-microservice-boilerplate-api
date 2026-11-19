/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { PermissionEntity, PermissionEntitySchema } from '@/core/permission/entity/permission'
import { IPermissionRepository } from '@/core/permission/repository/permission'
import { ICacheAsideAdapter } from '@/infra/cache/aside'
import { ValidateSchema } from '@/utils/decorators'
import { ApiNotFoundException } from '@/utils/exception'
import { IDGeneratorUtils } from '@/utils/id-generator'
import { Namespaces } from '@/utils/namespaces'
import { InferSchema, Schema } from '@/utils/schema'
import { IUsecase } from '@/utils/usecase'

import { RoleEntitySchema } from '../entity/role'
import { IRoleRepository } from '../repository/role'

export const RoleAddPermissionSchema = RoleEntitySchema.pick({
  id: true
}).and(Schema.object({ permissions: Schema.array(PermissionEntitySchema.shape.name) }))

export class RoleAddPermissionUsecase implements IUsecase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly permissionRepository: IPermissionRepository,
    private readonly cacheAside: ICacheAsideAdapter
  ) {}

  @ValidateSchema(RoleAddPermissionSchema)
  async execute(input: RoleAddPermissionInput): Promise<RoleAddPermissionOutput> {
    const role = await this.roleRepository.findOne({ id: input.id })

    if (!role) {
      throw new ApiNotFoundException('roleNotFound')
    }

    const permissions = await this.permissionRepository.findIn({ name: input.permissions })

    for (const permissionName of input.permissions) {
      const permission = permissions.find((p) => p.name === permissionName)

      role.addPermission(
        permission ??
          new PermissionEntity({
            id: IDGeneratorUtils.uuid(),
            name: permissionName
          })
      )
    }

    await this.roleRepository.create(role.toData())
    await this.cacheAside.invalidate(Namespaces.roleById(role.id))
  }
}

export type RoleAddPermissionInput = InferSchema<typeof RoleAddPermissionSchema>
export type RoleAddPermissionOutput = void
