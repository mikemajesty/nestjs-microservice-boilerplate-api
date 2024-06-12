import { z } from 'zod';

import { IRoleRepository } from '@/core/role/repository/role';
import { ILoggerAdapter } from '@/infra/logger';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';

import { RoleEntity, RoleEntitySchema } from './../entity/role';

export const RoleUpdateSchema = RoleEntitySchema.pick({
  id: true
}).merge(RoleEntitySchema.omit({ id: true }).partial());

export type RoleUpdateInput = z.infer<typeof RoleUpdateSchema>;
export type RoleUpdateOutput = RoleEntity;

export class RoleUpdateUsecase implements IUsecase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly loggerService: ILoggerAdapter
  ) {}

  @ValidateSchema(RoleUpdateSchema)
  async execute(input: RoleUpdateInput): Promise<RoleUpdateOutput> {
    const role = await this.roleRepository.findById(input.id);

    if (!role) {
      throw new ApiNotFoundException();
    }

    const roleFinded = new RoleEntity(role);

    const entity = new RoleEntity({ ...roleFinded, ...input });

    await this.roleRepository.updateOne({ id: entity.id }, entity);

    this.loggerService.info({ message: 'role updated.', obj: { role: input } });

    const updated = await this.roleRepository.findById(entity.id);

    return new RoleEntity(updated);
  }
}
