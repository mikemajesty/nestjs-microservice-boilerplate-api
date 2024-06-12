import { z } from 'zod';

import { RoleEntitySchema } from '@/core/role/entity/role';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';

import { RoleEntity } from '../entity/role';
import { IRoleRepository } from '../repository/role';

export const RoleGetByIdSchema = RoleEntitySchema.pick({
  id: true
});

export type RoleGetByIDInput = z.infer<typeof RoleGetByIdSchema>;
export type RoleGetByIDOutput = RoleEntity;

export class RoleGetByIdUsecase implements IUsecase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  @ValidateSchema(RoleGetByIdSchema)
  async execute({ id }: RoleGetByIDInput): Promise<RoleGetByIDOutput> {
    const role = await this.roleRepository.findById(id);

    if (!role) {
      throw new ApiNotFoundException();
    }

    return new RoleEntity(role);
  }
}
