/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { IPermissionRepository } from '@/core/permission/repository/permission'
import { ILoggerAdapter } from '@/infra/logger'
import { ValidateSchema } from '@/utils/decorators'
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception'
import { IUsecase } from '@/utils/usecase'
import { Infer } from '@/utils/validator'

import { PermissionEntity, PermissionEntitySchema } from './../entity/permission'

export const PermissionUpdateSchema = PermissionEntitySchema.pick({
  id: true
}).and(PermissionEntitySchema.omit({ id: true }).partial())

export class PermissionUpdateUsecase implements IUsecase {
  constructor(
    private readonly permissionRepository: IPermissionRepository,
    private readonly loggerService: ILoggerAdapter
  ) {}

  @ValidateSchema(PermissionUpdateSchema)
  async execute(input: PermissionUpdateInput): Promise<PermissionUpdateOutput> {
    const permission = await this.permissionRepository.findById(input.id)

    if (!permission) {
      throw new ApiNotFoundException('permissionNotFound')
    }

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

    await this.permissionRepository.updateOne({ id: entity.id }, entity.toObject())

    this.loggerService.info({ message: 'permission updated.', obj: { permission: input } })

    return entity.toObject()
  }
}

export type PermissionUpdateInput = Infer<typeof PermissionUpdateSchema>
export type PermissionUpdateOutput = PermissionEntity
