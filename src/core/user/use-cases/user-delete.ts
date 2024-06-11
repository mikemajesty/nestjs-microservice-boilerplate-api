import { z } from 'zod';

import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

import { UserEntity, UserEntitySchema } from '../entity/user';
import { UserPasswordEntity } from '../entity/user-password';
import { IUserRepository } from '../repository/user';

export const UserDeleteSchema = UserEntitySchema.pick({
  id: true
});

export type UserDeleteInput = z.infer<typeof UserDeleteSchema>;
export type UserDeleteOutput = UserEntity;

export class UserDeleteUsecase implements IUsecase {
  constructor(private readonly userRepository: IUserRepository) {}

  @ValidateSchema(UserDeleteSchema)
  async execute({ id }: UserDeleteInput, { tracing, user: userData }: ApiTrancingInput): Promise<UserDeleteOutput> {
    const user = await this.userRepository.findOneWithRelation({ id }, { password: true });

    if (!user) {
      throw new ApiNotFoundException('userNotFound');
    }

    const userEntity = new UserEntity(user);

    userEntity.setDeleted();

    const userPasswordEntity = new UserPasswordEntity(userEntity.password);

    userPasswordEntity.setDeleted();

    userEntity.password = userPasswordEntity;

    await this.userRepository.create(userEntity);

    tracing.logEvent('user-deleted', `user: ${user.email} deleted by: ${userData.email}`);

    return userEntity;
  }
}
