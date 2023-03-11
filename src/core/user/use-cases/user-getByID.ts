import { UserGetByIdSchema } from '@/modules/user/types';
import { UserGetByIDInput, UserGetByIDOutput } from '@/modules/user/types';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';

import { UserEntity } from '../entity/user';
import { IUserRepository } from '../repository/user';

export class UserGetByIdUsecase {
  constructor(private readonly userRepository: IUserRepository) {}

  @ValidateSchema(UserGetByIdSchema)
  async execute({ id }: UserGetByIDInput): Promise<UserGetByIDOutput> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new ApiNotFoundException('userNotFound');
    }

    return new UserEntity(user);
  }
}
