import { UserDeleteInput, UserDeleteOutput } from '@/modules/user/types';
import { ApiNotFoundException } from '@/utils/exception';

import { UserEntity } from '../entity/user';
import { IUserRepository } from '../repository/user';

export class UserDeleteUsecase {
  constructor(private readonly userRepository: IUserRepository) {}

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
