import { z } from 'zod';

import { IRoleRepository } from '@/core/role/repository/role';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';

import { RoleEntity, RoleEntitySchema } from '../entity/role';

export const RoleDeleteSchema = RoleEntitySchema.pick({
  id: true
});

export type RoleDeleteInput = z.infer<typeof RoleDeleteSchema>;
export type RoleDeleteOutput = RoleEntity;

export class RoleDeleteUsecase implements IUsecase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  @ValidateSchema(RoleDeleteSchema)
  async execute({ id }: RoleDeleteInput): Promise<RoleDeleteOutput> {
    const model = await this.roleRepository.findById(id);

    if (!model) {
      throw new ApiNotFoundException('roleNotFound');
    }

    const role = new RoleEntity(model);

    role.deactivated();

    await this.roleRepository.updateOne({ id: role.id }, role);

    return role;
  }
}
