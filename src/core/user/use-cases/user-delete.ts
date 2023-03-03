import { UserDeleteInput, UserDeleteOutput } from '@/modules/user/types';
import { ApiNotFoundException } from '@/utils/exception';

import { UserEntity } from '../entity/user';
import { IUserRepository } from '../repository/user';

export class UserDeleteUsecase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute({ id }: UserDeleteInput): Promise<UserDeleteOutput> {
    const user = new UserEntity(await this.userRepository.findById(id));

    if (!user) {
      throw new ApiNotFoundException('userNotFound');
    }

    user.setDelete();

    await this.userRepository.updateOne({ id: user.id }, user);

    const updated = await this.userRepository.findById(user.id);

    return new UserEntity(updated);
  }
}
