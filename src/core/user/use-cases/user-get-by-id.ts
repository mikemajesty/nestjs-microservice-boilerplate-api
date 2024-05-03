import { z } from 'zod';

import { ValidateSchema } from '@/common/decorators';
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
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new ApiNotFoundException();
    }

    const entity = new UserEntity(user);

    entity.anonymizePassword();

    return entity;
  }
}
