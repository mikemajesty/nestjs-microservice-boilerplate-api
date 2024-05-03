import { z } from 'zod';

import { ValidateSchema } from '@/common/decorators';
import { ILoggerAdapter } from '@/infra/logger';
import { ICryptoAdapter } from '@/libs/crypto';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

import { UserEntity, UserEntitySchema } from '../entity/user';
import { IUserRepository } from '../repository/user';

export const UserUpdateSchema = UserEntitySchema.pick({
  id: true
}).merge(UserEntitySchema.omit({ id: true }).partial());

export type UserUpdateInput = Partial<z.infer<typeof UserUpdateSchema>>;
export type UserUpdateOutput = UserEntity;

export class UserUpdateUsecase implements IUsecase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly loggerService: ILoggerAdapter,
    private readonly crypto: ICryptoAdapter
  ) {}

  @ValidateSchema(UserUpdateSchema)
  async execute(input: UserUpdateInput, { tracing, user: userData }: ApiTrancingInput): Promise<UserUpdateOutput> {
    const user = await this.userRepository.findById(input.id);

    if (!user) {
      throw new ApiNotFoundException();
    }

    const entity = new UserEntity({ ...user, ...input });

    const userExists = await this.userRepository.existsOnUpdate({ login: entity.login }, { id: entity.id });

    if (userExists) {
      throw new ApiConflictException('user exists');
    }

    const password = this.crypto.createHash(input.password);
    entity.password = password;
    await this.userRepository.updateOne({ id: entity.id }, entity);

    this.loggerService.info({ message: 'user updated.', obj: { user: input } });

    const updated = await this.userRepository.findById(entity.id);

    const entityUpdated = new UserEntity(updated);

    entityUpdated.anonymizePassword();

    tracing.logEvent('user-updated', `user: ${user.login} updated by: ${userData.login}`);

    return entityUpdated;
  }
}
