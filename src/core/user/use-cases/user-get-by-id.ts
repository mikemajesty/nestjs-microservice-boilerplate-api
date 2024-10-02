import { z } from 'zod';

import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';

import { UserEntity, UserEntitySchema } from '../entity/user';
import { IUserRepository } from '../repository/user';

export const UserGetByIdSchema = UserEntitySchema.pick({
  id: true
});

export type UserGetByIdInput = z.infer<typeof UserGetByIdSchema>;
export type UserGetByIdOutput = UserEntity;

export class UserGetByIdUsecase implements IUsecase {
  constructor(private readonly userRepository: IUserRepository) {}

  @ValidateSchema(UserGetByIdSchema)
  async execute({ id }: UserGetByIdInput): Promise<UserGetByIdOutput> {
    const user = await this.userRepository.findOne({ id });

    if (!user) {
      throw new ApiNotFoundException('userNotFound');
    }

    const entity = new UserEntity(user);

    return entity;
  }
}
