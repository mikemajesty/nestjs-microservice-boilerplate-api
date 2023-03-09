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
    const entity = new UserEntity({
      clientId: input.clientId,
      clientSecret: input.clientSecret,
      roles: input.roles,
      organization: { name: input.organization }
    });

    const userExists = await this.userRepository.findOne({
      clientId: entity.clientId,
      clientSecret: entity.clientSecret
    });

    if (userExists) {
      throw new ApiConflictException('userExists');
    }

    const user = await this.userRepository.create(entity);

    this.loggerServide.info({ message: 'user created.', obj: { user } });
    return user;
  }
}
