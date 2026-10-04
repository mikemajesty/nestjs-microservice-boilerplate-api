/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { PermissionEntity } from '@/core/permission/entity/permission'
import { IPermissionRepository } from '@/core/permission/repository/permission'
import { ICacheAsideAdapter } from '@/infra/cache/aside'
import { ValidateSchema } from '@/utils/decorators'
import { ApiNotFoundException } from '@/utils/exception'
import { IDGeneratorUtils } from '@/utils/id-generator'
import { Namespaces } from '@/utils/namespaces'
import { IUsecase } from '@/utils/usecase'
import { InputValidator, SchemaInfer } from '@/utils/validator'

import { RoleEntity, RoleEntitySchema } from '../entity/role'
import { IRoleRepository } from '../repository/role'

export const RoleAddPermissionSchema = RoleEntitySchema.pick({
  id: true
}).and(InputValidator.object({ permissions: InputValidator.array(InputValidator.string()) }))

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

    const entity = new RoleEntity(role)
    const permissions = await this.permissionRepository.findIn({ name: input.permissions })

    for (const permissionName of input.permissions) {
      const permissionAlreadyCreated = permissions.find((p) => p.name === permissionName)
      if (!permissionAlreadyCreated) {
        const newPermission = new PermissionEntity({ id: IDGeneratorUtils.uuid(), name: permissionName })
        entity.addPermission(newPermission)
        continue
      }

      entity.addPermission(permissionAlreadyCreated)
    }

    await this.roleRepository.create(entity.toObject())
    await this.cacheAside.invalidate(Namespaces.roleById(entity.id))
  }
}

export type RoleAddPermissionInput = SchemaInfer<typeof RoleAddPermissionSchema>
export type RoleAddPermissionOutput = void
