import { UserListInput, UserListOutput } from '@/modules/user/types';

import { UserEntity } from '../entity/user';
import { IUserRepository } from '../repository/user';

export class UserListUsecase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UserListInput): Promise<UserListOutput> {
    const users = await this.userRepository.paginate(input);

    return { docs: users.docs.map((u) => new UserEntity(u)), limit: users.limit, page: users.page, total: users.total };
  }
}
