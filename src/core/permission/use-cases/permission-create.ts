import { ILoggerAdapter } from '@/infra/logger';
import { ValidateSchema } from '@/utils/decorators';
import { ApiConflictException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';
import { UUIDUtils } from '@/utils/uuid';
import { Infer } from '@/utils/validator';

import { IPermissionRepository } from '../repository/permission';
import { PermissionEntity, PermissionEntitySchema } from './../entity/permission';

export const PermissionCreateSchema = PermissionEntitySchema.pick({
  name: true
});

export class PermissionCreateUsecase implements IUsecase {
  constructor(
    private readonly permissionRepository: IPermissionRepository,
    private readonly loggerService: ILoggerAdapter
  ) {}

  @ValidateSchema(PermissionCreateSchema)
  async execute(input: PermissionCreateInput): Promise<PermissionCreateOutput> {
    const permission = await this.permissionRepository.findOne({ name: input.name });

    if (permission) {
      throw new ApiConflictException('permissionExists');
    }

    const entity = new PermissionEntity({ id: UUIDUtils.create(), ...input });

    await this.permissionRepository.create(entity);

    this.loggerService.info({ message: 'permission created.', obj: { permission } });

    return entity;
  }
}

export type PermissionCreateInput = Infer<typeof PermissionCreateSchema>;
export type PermissionCreateOutput = PermissionEntity;
