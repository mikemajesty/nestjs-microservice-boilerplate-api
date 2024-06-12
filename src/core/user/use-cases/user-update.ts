import { z } from 'zod';

import { RoleEnum } from '@/core/role/entity/role';
import { IRoleRepository } from '@/core/role/repository/role';
import { ILoggerAdapter } from '@/infra/logger';
import { ValidateSchema } from '@/utils/decorators';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

import { UserEntity, UserEntitySchema } from '../entity/user';
import { IUserRepository } from '../repository/user';

export const UserUpdateSchema = UserEntitySchema.pick({
  id: true,
  name: true,
  email: true
})
  .merge(z.object({ role: z.nativeEnum(RoleEnum) }))
  .strict();

export type UserUpdateInput = Partial<z.infer<typeof UserUpdateSchema>>;
export type UserUpdateOutput = UserEntity;

export class UserUpdateUsecase implements IUsecase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly loggerService: ILoggerAdapter,
    private readonly roleRepository: IRoleRepository
  ) {}

  @ValidateSchema(UserUpdateSchema)
  async execute(input: UserUpdateInput, { tracing, user: userData }: ApiTrancingInput): Promise<UserUpdateOutput> {
    const user = await this.userRepository.findOneWithRelation({ id: input.id }, { role: true });

    if (!user) {
      throw new ApiNotFoundException('userNotFound');
    }

    const role = await this.roleRepository.findOne({ name: input.role });

    if (!role) {
      throw new ApiNotFoundException('roleNotFound');
    }

    const entity = new UserEntity({ ...user, ...input, role });

    const userExists = await this.userRepository.existsOnUpdate({ email: entity.email }, { id: entity.id });

    if (userExists) {
      throw new ApiConflictException('userExists');
    }

    await this.userRepository.updateOne({ id: entity.id }, entity);

    this.loggerService.info({ message: 'user updated.', obj: { user: input } });

    const updated = await this.userRepository.findOneWithRelation({ id: entity.id }, { role: true });

    const entityUpdated = new UserEntity(updated);

    tracing.logEvent('user-updated', `user: ${user.email} updated by: ${userData.email}`);

    return entityUpdated;
  }
}
