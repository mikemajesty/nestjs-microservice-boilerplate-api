import { z } from 'zod';

import { IPermissionRepository } from '@/core/permission/repository/permission';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';

import { PermissionEntity, PermissionEntitySchema } from '../entity/permission';

export const PermissionDeleteSchema = PermissionEntitySchema.pick({
  id: true
});

export type PermissionDeleteInput = z.infer<typeof PermissionDeleteSchema>;
export type PermissionDeleteOutput = PermissionEntity;

export class PermissionDeleteUsecase implements IUsecase {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  @ValidateSchema(PermissionDeleteSchema)
  async execute({ id }: PermissionDeleteInput): Promise<PermissionDeleteOutput> {
    const model = await this.permissionRepository.findById(id);

    if (!model) {
      throw new ApiNotFoundException('permissionNotFound');
    }

    const permission = new PermissionEntity(model);

    permission.deactivated();

    await this.permissionRepository.updateOne({ id: permission.id }, permission);

    return permission;
  }
}
