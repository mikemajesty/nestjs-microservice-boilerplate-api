import { ILoggerAdapter } from '@/infra/logger';
import { UserUpdateInput, UserUpdateOutput, UserUpdateSchema } from '@/modules/user/types';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';

import { UserEntity } from '../entity/user';
import { IUserRepository } from '../repository/user';

export class UserUpdateUsecase {
  constructor(private readonly userRepository: IUserRepository, private readonly loggerServide: ILoggerAdapter) {}

  @ValidateSchema(UserUpdateSchema)
  async execute(input: UserUpdateInput): Promise<UserUpdateOutput> {
    const user = await this.userRepository.findById(input.id);

    if (!user) {
      throw new ApiNotFoundException('userNotFound');
    }

    const userFinded = new UserEntity(user);

    if (input.organization) {
      userFinded.organization.name = input.organization;
      delete input.organization;
    }

    const updatedInput = { ...input, organization: undefined };
    delete updatedInput.organization;

    const entity = new UserEntity({ ...userFinded, ...updatedInput });

    const userExists = await this.userRepository.existsOnUpdate(
      { clientId: entity.clientId, clientSecret: entity.clientSecret },
      [{ id: entity.id }]
    );

    if (userExists) {
      throw new ApiConflictException('userExists');
    }

    await this.userRepository.updateOne({ id: entity.id }, entity);

    this.loggerServide.info({ message: 'user updated.', obj: { user: input } });

    const updated = await this.userRepository.findById(entity.id);

    return new UserEntity(updated);
  }
}
