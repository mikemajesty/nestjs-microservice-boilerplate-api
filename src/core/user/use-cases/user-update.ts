import { z } from 'zod';

import { ILoggerAdapter } from '@/infra/logger';
import { ValidateSchema } from '@/utils/decorators';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

import { UserEntity, UserEntitySchema } from '../entity/user';
import { IUserRepository } from '../repository/user';

export const UserUpdateSchema = UserEntitySchema.pick({
  id: true
})
  .merge(UserEntitySchema.omit({ id: true }).partial())
  .strict();

export type UserUpdateInput = Partial<z.infer<typeof UserUpdateSchema>>;
export type UserUpdateOutput = UserEntity;

export class UserUpdateUsecase implements IUsecase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly loggerService: ILoggerAdapter
  ) {}

  @ValidateSchema(UserUpdateSchema)
  async execute(input: UserUpdateInput, { tracing, user: userData }: ApiTrancingInput): Promise<UserUpdateOutput> {
    const user = await this.userRepository.findById(input.id);

    if (!user) {
      throw new ApiNotFoundException();
    }

    const entity = new UserEntity({ ...user, ...input });

    const userExists = await this.userRepository.existsOnUpdate({ email: entity.email }, { id: entity.id });

    if (userExists) {
      throw new ApiConflictException('user exists');
    }

    await this.userRepository.updateOne({ id: entity.id }, entity);

    this.loggerService.info({ message: 'user updated.', obj: { user: input } });

    const updated = await this.userRepository.findById(entity.id);

    const entityUpdated = new UserEntity(updated);

    tracing.logEvent('user-updated', `user: ${user.email} updated by: ${userData.email}`);

    return entityUpdated;
  }
}
