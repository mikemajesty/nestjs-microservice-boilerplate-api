import { z } from 'zod';

import { ILoggerAdapter } from '@/infra/logger';
import { CreatedModel } from '@/infra/repository';
import { ValidateSchema } from '@/utils/decorators';
import { IUsecase } from '@/utils/usecase';

import { IPermissionRepository } from '../repository/permission';
import { PermissionEntity, PermissionEntitySchema } from './../entity/permission';

export const PermissionCreateSchema = PermissionEntitySchema.pick({
  name: true
});

export type PermissionCreateInput = z.infer<typeof PermissionCreateSchema>;
export type PermissionCreateOutput = CreatedModel;

export class PermissionCreateUsecase implements IUsecase {
  constructor(
    private readonly permissionRepository: IPermissionRepository,
    private readonly loggerService: ILoggerAdapter
  ) {}

  @ValidateSchema(PermissionCreateSchema)
  async execute(input: PermissionCreateInput): Promise<PermissionCreateOutput> {
    const entity = new PermissionEntity(input);

    const permission = await this.permissionRepository.create(entity);

    this.loggerService.info({ message: 'permission created.', obj: { permission } });

    return permission;
  }
}
