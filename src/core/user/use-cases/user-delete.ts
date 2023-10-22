import { z } from 'zod';

import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';
import { ApiTrancingInput } from '@/utils/request';

import { UserEntity, UserEntitySchema } from '../entity/user';
import { IUserRepository } from '../repository/user';

export const UserDeleteSchema = UserEntitySchema.pick({
  id: true
});

export type UserDeleteInput = z.infer<typeof UserDeleteSchema>;
export type UserDeleteOutput = UserEntity;

export class UserDeleteUsecase {
  constructor(private readonly userRepository: IUserRepository) {}

  @ValidateSchema(UserDeleteSchema)
  async execute({ id }: UserDeleteInput, { tracing, user: userData }: ApiTrancingInput): Promise<UserDeleteOutput> {
    const entity = await this.userRepository.findById(id);

    if (!entity) {
      throw new ApiNotFoundException();
    }

    const user = new UserEntity(entity);

    user.setDelete();

    await this.userRepository.updateOne({ id: user.id }, user);

    user.anonymizePassword();

    tracing.logEvent('user-deleted', `user: ${entity.login} deleted by: ${userData.login}`);

    return user;
  }
}
