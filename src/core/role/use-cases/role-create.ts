import { ILoggerAdapter } from '@/infra/logger';
import { CreatedModel } from '@/infra/repository';
import { ValidateSchema } from '@/utils/decorators';
import { IUsecase } from '@/utils/usecase';
import { UUIDUtils } from '@/utils/uuid';
import { Infer } from '@/utils/validator';

import { IRoleRepository } from '../repository/role';
import { RoleEntity, RoleEntitySchema } from './../entity/role';

export const RoleCreateSchema = RoleEntitySchema.pick({
  name: true
}).strict();

export class RoleCreateUsecase implements IUsecase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly loggerService: ILoggerAdapter
  ) {}

  @ValidateSchema(RoleCreateSchema)
  async execute(input: RoleCreateInput): Promise<RoleCreateOutput> {
    const entity = new RoleEntity({ id: UUIDUtils.create(), ...input });

    const role = await this.roleRepository.create(entity);

    this.loggerService.info({ message: 'role created.', obj: { role } });

    return role;
  }
}

export type RoleCreateInput = Infer<typeof RoleCreateSchema>;
export type RoleCreateOutput = CreatedModel;
