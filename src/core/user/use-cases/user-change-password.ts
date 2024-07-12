import { z } from 'zod';

import { ICryptoAdapter } from '@/libs/crypto';
import { ValidateSchema } from '@/utils/decorators';
import { ApiBadRequestException, ApiNotFoundException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';

import { UserEntitySchema } from '../entity/user';
import { UserPasswordEntity } from '../entity/user-password';
import { IUserRepository } from '../repository/user';

export const UserChangePasswordSchema = UserEntitySchema.pick({
  id: true
}).merge(z.object({ password: z.string(), newPassword: z.string(), confirmPassword: z.string() }));

export type UserChangePasswordInput = z.infer<typeof UserChangePasswordSchema>;
export type UserChangePasswordOutput = void;

export class UserChangePasswordUsecase implements IUsecase {
  constructor(
    private readonly repository: IUserRepository,
    private readonly crypto: ICryptoAdapter
  ) {}

  @ValidateSchema(UserChangePasswordSchema)
  async execute(input: UserChangePasswordInput): Promise<UserChangePasswordOutput> {
    const user = await this.repository.findOneWithRelation({ id: input.id }, { password: true });

    if (!user) {
      throw new ApiNotFoundException('userNotFound');
    }

    const entityPassword = new UserPasswordEntity(user.password);

    const password = this.crypto.createHash(input.password);

    entityPassword.verifyPassword(password);

    if (input.newPassword !== input.confirmPassword) {
      throw new ApiBadRequestException('passwordIsDifferent');
    }

    const newPassword = this.crypto.createHash(input.newPassword);
    entityPassword.password = newPassword;

    user.password = entityPassword;

    await this.repository.create(user);
  }
}
