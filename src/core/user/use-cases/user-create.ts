import { ILoggerAdapter } from '@/infra/logger';
import { UserCreateInput, UserCreateOutput, UserCreateSchema } from '@/modules/user/types';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiConflictException } from '@/utils/exception';

import { UserEntity } from '../entity/user';
import { IUserRepository } from '../repository/user';

export class UserCreateUsecase {
  constructor(private readonly userRepository: IUserRepository, private readonly loggerServide: ILoggerAdapter) {}

  @ValidateSchema(UserCreateSchema)
  async execute(input: UserCreateInput): Promise<UserCreateOutput> {
    const entity = new UserEntity(input);

    const userExists = await this.userRepository.findOne({
      login: entity.login,
      password: entity.password
    });

    if (userExists) {
      throw new ApiConflictException('userExists');
    }

    const session = await this.userRepository.startSession();

    try {
      const user = await this.userRepository.create(entity, { session });

      await session.commitTransaction();

      this.loggerServide.info({ message: 'user created.', obj: { user } });
      return user;
    } catch (error) {
      await session.commitTransaction();
      throw error;
    }
  }
}
