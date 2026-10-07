/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { ILoggerAdapter } from '@/infra/logger'
import { ValidateSchema } from '@/utils/decorators'
import { ApiConflictException } from '@/utils/exception'
import { IDGeneratorUtils } from '@/utils/id-generator'
import { IUsecase } from '@/utils/usecase'
import { SchemaInfer } from '@/utils/validator'

import { IPermissionRepository } from '../repository/permission'
import { PermissionEntity, PermissionEntitySchema } from './../entity/permission'

export const PermissionCreateSchema = PermissionEntitySchema.pick({
  name: true
})

export class PermissionCreateUsecase implements IUsecase {
  constructor(
    private readonly permissionRepository: IPermissionRepository,
    private readonly loggerService: ILoggerAdapter
  ) {}

  @ValidateSchema(PermissionCreateSchema)
  async execute(input: PermissionCreateInput): Promise<PermissionCreateOutput> {
    const permission = await this.permissionRepository.findOne({ name: input.name })

    if (permission) {
      throw new ApiConflictException('permissionExists')
    }

    const entity = new PermissionEntity({ id: IDGeneratorUtils.uuid(), ...input })

    await this.permissionRepository.create(entity.toData())

    this.loggerService.info({ message: 'permission created.', metadata: { permission } })

    return entity.toData()
  }
}

export type PermissionCreateInput = SchemaInfer<typeof PermissionCreateSchema>
export type PermissionCreateOutput = PermissionEntity
