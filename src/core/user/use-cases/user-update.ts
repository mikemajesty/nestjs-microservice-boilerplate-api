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
  .merge(z.object({ roles: z.array(z.nativeEnum(RoleEnum)) }))
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
    const user = await this.userRepository.findOne({ id: input.id });

    if (!user) {
      throw new ApiNotFoundException('userNotFound');
    }

    const roles = await this.roleRepository.findIn({ name: input.roles });

    if (roles.length < input.roles.length) {
      throw new ApiNotFoundException('roleNotFound');
    }

    const entity = new UserEntity({ ...user, ...input, roles });

    const userExists = await this.userRepository.existsOnUpdate({ email: entity.email }, { id: entity.id });

    if (userExists) {
      throw new ApiConflictException('userExists');
    }

    await this.userRepository.create(entity);

    this.loggerService.info({ message: 'user updated.', obj: { user: input } });

    const updated = await this.userRepository.findOne({ id: entity.id });

    const entityUpdated = new UserEntity(updated);

    tracing.logEvent('user-updated', `user: ${user.email} updated by: ${userData.email}`);

    return entityUpdated;
  }
}
