import { UserListInput, UserListOutput, UserListSchema } from '@/modules/user/types';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';

import { UserEntity } from '../entity/user';
import { IUserRepository } from '../repository/user';

export class UserListUsecase {
  constructor(private readonly userRepository: IUserRepository) {}

  @ValidateSchema(UserListSchema)
  async execute(input: UserListInput): Promise<UserListOutput> {
    const users = await this.userRepository.paginate(input);

    return { docs: users.docs.map((u) => new UserEntity(u)), limit: users.limit, page: users.page, total: users.total };
  }
}
