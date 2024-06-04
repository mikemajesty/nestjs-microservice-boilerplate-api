import { z } from 'zod';

import { ICryptoAdapter } from '@/libs/crypto';
import { ValidateSchema } from '@/utils/decorators';
import { ApiBadRequestException, ApiNotFoundException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';

import { UserEntity, UserEntitySchema } from '../entity/user';
import { IUserRepository } from '../repository/user';

export const UserChangePasswordSchema = UserEntitySchema.pick({
  id: true,
  password: true
}).merge(z.object({ newPassword: z.string(), confirmPassword: z.string() }));

export type UserChangePasswordInput = z.infer<typeof UserChangePasswordSchema>;
export type UserChangePasswordOutput = void;

export class UserChangePasswordUsecase implements IUsecase {
  constructor(
    private readonly repsotory: IUserRepository,
    private readonly crypto: ICryptoAdapter
  ) {}

  @ValidateSchema(UserChangePasswordSchema)
  async execute(input: UserChangePasswordInput): Promise<UserChangePasswordOutput> {
    const user = await this.repsotory.findById(input.id);

    if (!user) {
      throw new ApiNotFoundException('userNotFound');
    }

    const entity = new UserEntity(user);

    const password = this.crypto.createHash(input.password);
    entity.verifyPassword(password);

    if (input.newPassword !== input.confirmPassword) {
      throw new ApiBadRequestException('passwordIsDifferent');
    }

    const newPassword = this.crypto.createHash(input.newPassword);
    entity.changePassword(newPassword);

    await this.repsotory.updateOne({ id: entity.id }, entity);
  }
}
