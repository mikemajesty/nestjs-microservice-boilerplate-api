import { z } from 'zod';

import { IPermissionRepository } from '@/core/permission/repository/permission';
import { ILoggerAdapter } from '@/infra/logger';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';

import { PermissionEntity, PermissionEntitySchema } from './../entity/permission';

export const PermissionUpdateSchema = PermissionEntitySchema.pick({
  id: true
}).merge(PermissionEntitySchema.omit({ id: true }).partial());

export type PermissionUpdateInput = z.infer<typeof PermissionUpdateSchema>;
export type PermissionUpdateOutput = PermissionEntity;

export class PermissionUpdateUsecase implements IUsecase {
  constructor(
    private readonly permissionRepository: IPermissionRepository,
    private readonly loggerService: ILoggerAdapter
  ) {}

  @ValidateSchema(PermissionUpdateSchema)
  async execute(input: PermissionUpdateInput): Promise<PermissionUpdateOutput> {
    const permission = await this.permissionRepository.findById(input.id);

    if (!permission) {
      throw new ApiNotFoundException();
    }

    const permissionFinded = new PermissionEntity(permission);

    const entity = new PermissionEntity({ ...permissionFinded, ...input });

    await this.permissionRepository.updateOne({ id: entity.id }, entity);

    this.loggerService.info({ message: 'permission updated.', obj: { permission: input } });

    const updated = await this.permissionRepository.findById(entity.id);

    return new PermissionEntity(updated);
  }
}
