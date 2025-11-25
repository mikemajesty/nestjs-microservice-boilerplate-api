import { RoleEnum } from '@/core/role/entity/role';
import { IRoleRepository } from '@/core/role/repository/role';
import { ILoggerAdapter } from '@/infra/logger';
import { ValidateSchema } from '@/utils/decorators';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';
import { Infer, InputValidator } from '@/utils/validator';

import { UserEntity, UserEntitySchema } from '../entity/user';
import { IUserRepository } from '../repository/user';

export const UserUpdateSchema = UserEntitySchema.pick({
  id: true
})
  .merge(UserEntitySchema.pick({ name: true, email: true, roles: true }).partial())
  .merge(InputValidator.object({ roles: InputValidator.array(InputValidator.enum(RoleEnum)).optional() }))
  .strict();

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

    const roles = await this.getRoles(input);

    const entity = new UserEntity({ ...user, ...input, roles: roles ?? user.roles });

    const userExists = await this.userRepository.existsOnUpdate({ email: entity.email }, { id: entity.id });

    if (userExists) {
      throw new ApiConflictException('userExists');
    }

    await this.userRepository.create(entity);

    this.loggerService.info({ message: 'user updated.', obj: { user: input } });

    const updated = await this.userRepository.findOne({ id: entity.id });

    const entityUpdated = new UserEntity(updated as UserEntity);

    tracing.logEvent('user-updated', `user: ${user.email} updated by: ${userData.email}`);

    return entityUpdated;
  }

  private async getRoles(input: UserUpdateInput) {
    if (input.roles) {
      const roles = await this.roleRepository.findIn({ name: input.roles });

      if (roles.length < (input.roles as RoleEnum[]).length) {
        throw new ApiNotFoundException('roleNotFound');
      }

      return roles;
    }
  }
}

export type UserUpdateInput = Partial<Infer<typeof UserUpdateSchema>>;
export type UserUpdateOutput = UserEntity;
