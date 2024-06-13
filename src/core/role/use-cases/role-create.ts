import { z } from 'zod';

import { ILoggerAdapter } from '@/infra/logger';
import { CreatedModel } from '@/infra/repository';
import { ValidateSchema } from '@/utils/decorators';
import { IUsecase } from '@/utils/usecase';

import { IRoleRepository } from '../repository/role';
import { RoleEntity, RoleEntitySchema } from './../entity/role';

export const RoleCreateSchema = RoleEntitySchema.pick({
  name: true
}).strict();

export type RoleCreateInput = z.infer<typeof RoleCreateSchema>;
export type RoleCreateOutput = CreatedModel;

export class RoleCreateUsecase implements IUsecase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly loggerService: ILoggerAdapter
  ) {}

  @ValidateSchema(RoleCreateSchema)
  async execute(input: RoleCreateInput): Promise<RoleCreateOutput> {
    const entity = new RoleEntity(input);

    const role = await this.roleRepository.create(entity);

    this.loggerService.info({ message: 'role created.', obj: { role } });

    return role;
  }
}
