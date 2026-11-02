/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { IPermissionRepository } from '@/core/permission/repository/permission'
import { ICacheAsideAdapter } from '@/infra/cache/aside'
import { ValidateSchema } from '@/utils/decorators'
import { ApiNotFoundException } from '@/utils/exception'
import { Namespaces } from '@/utils/namespaces'
import { IUsecase } from '@/utils/usecase'
import { InputValidator, SchemaInfer } from '@/utils/validator'

import { RoleEntitySchema } from '../entity/role'
import { IRoleRepository } from '../repository/role'

export const RoleDeletePermissionSchema = RoleEntitySchema.pick({
  id: true
}).and(InputValidator.object({ permissions: InputValidator.array(InputValidator.string()) }))

export class RoleDeletePermissionUsecase implements IUsecase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly permissionRepository: IPermissionRepository,
    private readonly cacheAside: ICacheAsideAdapter
  ) {}

  @ValidateSchema(RoleDeletePermissionSchema)
  async execute(input: RoleDeletePermissionInput): Promise<RoleDeletePermissionOutput> {
    const role = await this.roleRepository.findOne({ id: input.id })

    if (!role) {
      throw new ApiNotFoundException('roleNotFound')
    }

    const permissions = await this.permissionRepository.findIn({ name: input.permissions })

    for (const permission of input.permissions) {
      const permissionExists = permissions.find((p) => p.name === permission)
      if (!permissionExists) {
        continue
      }
      role.removePermissionByName(permission)
    }

    await this.roleRepository.create(role.toData())
    await this.cacheAside.invalidate(Namespaces.roleById(role.id))
  }
}

export type RoleDeletePermissionInput = SchemaInfer<typeof RoleDeletePermissionSchema>
export type RoleDeletePermissionOutput = void
