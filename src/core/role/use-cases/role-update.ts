import { IRoleRepository } from '@/core/role/repository/role';
import { ILoggerAdapter } from '@/infra/logger';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';
import { Infer } from '@/utils/validator';

import { RoleEntity, RoleEntitySchema } from './../entity/role';

export const RoleUpdateSchema = RoleEntitySchema.pick({
  id: true
})
  .merge(RoleEntitySchema.pick({ name: true }).partial())
  .strict();

export class RoleUpdateUsecase implements IUsecase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly loggerService: ILoggerAdapter
  ) {}

  @ValidateSchema(RoleUpdateSchema)
  async execute(input: RoleUpdateInput): Promise<RoleUpdateOutput> {
    const role = await this.roleRepository.findById(input.id);

    if (!role) {
      throw new ApiNotFoundException('roleNotFound');
    }

    const entity = new RoleEntity({ ...role, ...input });

    await this.roleRepository.create(entity);

    this.loggerService.info({ message: 'role updated.', obj: { roles: input } });

    const updated = await this.roleRepository.findById(entity.id);

    return new RoleEntity(updated as RoleEntity);
  }
}

export type RoleUpdateInput = Infer<typeof RoleUpdateSchema>;
export type RoleUpdateOutput = RoleEntity;
