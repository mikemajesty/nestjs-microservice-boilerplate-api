import { IRoleRepository } from '@/core/role/repository/role';
import { ValidateSchema } from '@/utils/decorators';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';
import { Infer } from '@/utils/validator';

import { RoleEntity, RoleEntitySchema } from '../entity/role';

export const RoleDeleteSchema = RoleEntitySchema.pick({
  id: true
});

export class RoleDeleteUsecase implements IUsecase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  @ValidateSchema(RoleDeleteSchema)
  async execute({ id }: RoleDeleteInput): Promise<RoleDeleteOutput> {
    const role = await this.roleRepository.findById(id);

    if (!role) {
      throw new ApiNotFoundException('roleNotFound');
    }

    if (role.permissions?.length) {
      throw new ApiConflictException(`roleHasAssociationWithPermission: ${role.permissions.map((p) => p.name)}`);
    }

    const entity = new RoleEntity(role);

    entity.deactivated();

    await this.roleRepository.create(entity);

    return entity;
  }
}

export type RoleDeleteInput = Infer<typeof RoleDeleteSchema>;
export type RoleDeleteOutput = RoleEntity;
