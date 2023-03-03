import { UserGetByIDInput, UserGetByIDOutput } from '@/modules/user/types';
import { ApiNotFoundException } from '@/utils/exception';

import { UserEntity } from '../entity/user';
import { IUserRepository } from '../repository/user';

export class UserGetByIdUsecase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute({ id }: UserGetByIDInput): Promise<UserGetByIDOutput> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new ApiNotFoundException('userNotFound');
    }

    return new UserEntity(user);
  }
}
