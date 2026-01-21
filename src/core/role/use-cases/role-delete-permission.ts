/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { IPermissionRepository } from '@/core/permission/repository/permission'
import { ValidateSchema } from '@/utils/decorators'
import { ApiNotFoundException } from '@/utils/exception'
import { IUsecase } from '@/utils/usecase'
import { Infer, InputValidator } from '@/utils/validator'

import { RoleEntity, RoleEntitySchema } from '../entity/role'
import { IRoleRepository } from '../repository/role'

export const RoleDeletePermissionSchema = RoleEntitySchema.pick({
  id: true
}).and(InputValidator.object({ permissions: InputValidator.array(InputValidator.string()) }))

export class RoleDeletePermissionUsecase implements IUsecase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly permissionRepository: IPermissionRepository
  ) {}

  @ValidateSchema(RoleDeletePermissionSchema)
  async execute(input: RoleDeletePermissionInput): Promise<RoleDeletePermissionOutput> {
    const role = await this.roleRepository.findOne({ id: input.id })

    if (!role) {
      throw new ApiNotFoundException('roleNotFound')
    }

    const entity = new RoleEntity(role)

    const permissions = await this.permissionRepository.findIn({ name: input.permissions })

    for (const permission of input.permissions) {
      const permissionExists = permissions.find((p) => p.name === permission)
      if (!permissionExists) {
        continue
      }
      entity.removePermissionByName(permission)
    }

    await this.roleRepository.create(entity.toObject())
  }
}

export type RoleDeletePermissionInput = Infer<typeof RoleDeletePermissionSchema>
export type RoleDeletePermissionOutput = void
