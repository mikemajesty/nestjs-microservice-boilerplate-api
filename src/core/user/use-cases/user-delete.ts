import { UserDeleteInput, UserDeleteOutput, UserDeleteSchema } from '@/modules/user/types';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';

import { UserEntity } from '../entity/user';
import { IUserRepository } from '../repository/user';

export class UserDeleteUsecase {
  constructor(private readonly userRepository: IUserRepository) {}

  @ValidateSchema(UserDeleteSchema)
  async execute({ id }: UserDeleteInput): Promise<UserDeleteOutput> {
    const model = await this.userRepository.findById(id);

    if (!model) {
      throw new ApiNotFoundException('userNotFound');
    }

    const user = new UserEntity(model);

    user.setDelete();

    await this.userRepository.updateOne({ id: user.id }, user);

    return user;
  }
}
