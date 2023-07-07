import { z } from 'zod';

import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';

import { UserEntity, UserEntitySchema } from '../entity/user';
import { IUserRepository } from '../repository/user';

export const UserDeleteSchema = UserEntitySchema.pick({
  id: true
});

export type UserDeleteInput = z.infer<typeof UserDeleteSchema>;
export type UserDeleteOutput = Promise<UserEntity>;

export class UserDeleteUsecase {
  constructor(private readonly userRepository: IUserRepository) {}

  @ValidateSchema(UserDeleteSchema)
  async execute({ id }: UserDeleteInput): Promise<UserDeleteOutput> {
    const model = await this.userRepository.findById(id);

    if (!model) {
      throw new ApiNotFoundException({ message: 'user not found' });
    }

    const user = new UserEntity(model);

    user.setDelete();

    await this.userRepository.updateOne({ id: user.id }, user);

    user.anonymizePassword();
    return user;
  }
}
