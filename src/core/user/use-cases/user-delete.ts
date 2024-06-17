import { z } from 'zod';

import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';

import { UserEntity, UserEntitySchema } from '../entity/user';
import { IUserRepository } from '../repository/user';

export const UserDeleteSchema = UserEntitySchema.pick({
  id: true
});

export type UserDeleteInput = z.infer<typeof UserDeleteSchema>;
export type UserDeleteOutput = UserEntity;

export class UserDeleteUsecase implements IUsecase {
  constructor(private readonly userRepository: IUserRepository) {}

  @ValidateSchema(UserDeleteSchema)
  async execute({ id }: UserDeleteInput): Promise<UserDeleteOutput> {
    const user = await this.userRepository.findOneWithRelation({ id }, { password: true, role: true });

    if (!user) {
      throw new ApiNotFoundException('userNotFound');
    }

    const userEntity = new UserEntity(user);

    await this.userRepository.softRemove(userEntity);

    return userEntity;
  }
}
