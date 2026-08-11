/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { InvalidateTags } from '@nestjs-redisx/cache'

import { IRoleRepository } from '@/core/role/repository/role'
import { USER_PERMISSIONS_CACHE_TAG } from '@/infra/cache'
import { ValidateSchema } from '@/utils/decorators'
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception'
import { IUsecase } from '@/utils/usecase'
import { Infer } from '@/utils/validator'

import { RoleEntity, RoleEntitySchema } from '../entity/role'

export const RoleDeleteSchema = RoleEntitySchema.pick({
  id: true
})

export class RoleDeleteUsecase implements IUsecase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  @InvalidateTags({ tags: [USER_PERMISSIONS_CACHE_TAG] })
  @ValidateSchema(RoleDeleteSchema)
  async execute({ id }: RoleDeleteInput): Promise<RoleDeleteOutput> {
    const role = await this.roleRepository.findById(id)

    if (!role) {
      throw new ApiNotFoundException('roleNotFound')
    }

    if (role.permissions?.length) {
      throw new ApiConflictException(`roleHasAssociationWithPermission: ${role.permissions.map((p) => p.name)}`)
    }

    const entity = new RoleEntity(role)

    entity.deactivate()

    await this.roleRepository.create(entity.toObject())

    return entity.toObject()
  }
}

export type RoleDeleteInput = Infer<typeof RoleDeleteSchema>
export type RoleDeleteOutput = RoleEntity
