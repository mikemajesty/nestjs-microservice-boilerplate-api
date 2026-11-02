/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { IRoleRepository } from '@/core/role/repository/role'
import { ILoggerAdapter } from '@/infra/logger'
import { ValidateSchema } from '@/utils/decorators'
import { ApiNotFoundException } from '@/utils/exception'
import { IUsecase } from '@/utils/usecase'
import { SchemaInfer } from '@/utils/validator'

import { RoleEntity, RoleEntitySchema } from './../entity/role'

export const RoleUpdateSchema = RoleEntitySchema.pick({
  id: true
}).and(RoleEntitySchema.pick({ name: true }).partial())

export class RoleUpdateUsecase implements IUsecase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly loggerService: ILoggerAdapter
  ) {}

  @ValidateSchema(RoleUpdateSchema)
  async execute(input: RoleUpdateInput): Promise<RoleUpdateOutput> {
    const role = await this.roleRepository.findById(input.id)

    if (!role) {
      throw new ApiNotFoundException('roleNotFound')
    }

    role.merge(input)

    await this.roleRepository.create(role.toData())

    this.loggerService.info({ message: 'role updated.', metadata: { roles: input } })

    const updated = await this.roleRepository.findById(role.id)

    return updated!.toData()
  }
}

export type RoleUpdateInput = SchemaInfer<typeof RoleUpdateSchema>
export type RoleUpdateOutput = RoleEntity
