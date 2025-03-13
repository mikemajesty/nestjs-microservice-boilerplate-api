import { IPermissionRepository } from '@/core/permission/repository/permission';
import { ValidateSchema } from '@/utils/decorators';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';
import { Infer } from '@/utils/validator';

import { PermissionEntity, PermissionEntitySchema } from '../entity/permission';

export const PermissionDeleteSchema = PermissionEntitySchema.pick({
  id: true
});

export class PermissionDeleteUsecase implements IUsecase {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  @ValidateSchema(PermissionDeleteSchema)
  async execute({ id }: PermissionDeleteInput): Promise<PermissionDeleteOutput> {
    const permission = await this.permissionRepository.findOneWithRelation({ id }, { roles: true });

    if (!permission) {
      throw new ApiNotFoundException('permissionNotFound');
    }

    if (permission.roles?.length) {
      throw new ApiConflictException(
        `permissionHasAssociationWithRole: ${permission.roles.map((r) => r.name).join(', ')}`
      );
    }

    const entity = new PermissionEntity(permission);

    entity.deactivated();

    await this.permissionRepository.create(entity);

    return entity;
  }
}

export type PermissionDeleteInput = Infer<typeof PermissionDeleteSchema>;
export type PermissionDeleteOutput = PermissionEntity;
