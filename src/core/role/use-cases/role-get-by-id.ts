import { RoleEntitySchema } from '@/core/role/entity/role';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';
import { Infer } from '@/utils/validator';

import { RoleEntity } from '../entity/role';
import { IRoleRepository } from '../repository/role';

export const RoleGetByIdSchema = RoleEntitySchema.pick({
  id: true
});

export class RoleGetByIdUsecase implements IUsecase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  @ValidateSchema(RoleGetByIdSchema)
  async execute({ id }: RoleGetByIdInput): Promise<RoleGetByIdOutput> {
    const role = await this.roleRepository.findById(id);

    if (!role) {
      throw new ApiNotFoundException('roleNotFound');
    }

    return new RoleEntity(role);
  }
}

export type RoleGetByIdInput = Infer<typeof RoleGetByIdSchema>;
export type RoleGetByIdOutput = RoleEntity;
