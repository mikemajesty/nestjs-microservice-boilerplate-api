import { z } from 'zod';

import { ValidateSchema } from '@/common/decorators';
import { ILoggerAdapter } from '@/infra/logger';
import { CreatedModel } from '@/infra/repository';
import { ICryptoAdapter } from '@/libs/crypto';
import { ApiConflictException } from '@/utils/exception';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

import { UserEntity, UserEntitySchema } from '../entity/user';
import { IUserRepository } from '../repository/user';

export const UserCreateSchema = UserEntitySchema.pick({
  login: true,
  password: true,
  roles: true
});

export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type UserCreateOutput = CreatedModel;

export class UserCreateUsecase implements IUsecase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly loggerService: ILoggerAdapter,
    private readonly crypto: ICryptoAdapter
  ) {}

  @ValidateSchema(UserCreateSchema)
  async execute(input: UserCreateInput, { tracing, user: userData }: ApiTrancingInput): Promise<UserCreateOutput> {
    const entity = new UserEntity(input);

    const userExists = await this.userRepository.findOne({
      login: entity.login
    });

    if (userExists) {
      throw new ApiConflictException('user exists');
    }

    const session = await this.userRepository.startSession();

    try {
      const password = this.crypto.createHash(input.password);
      entity.password = password;
      const user = await this.userRepository.create(entity, { session });

      await session.commitTransaction();

      this.loggerService.info({ message: 'user created successfully', obj: { user } });

      tracing.logEvent('user-created', `user: ${entity.login} created by: ${userData.login}`);

      return user;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  }
}
