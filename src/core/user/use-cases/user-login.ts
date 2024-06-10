import { z } from 'zod';

import { ICryptoAdapter } from '@/libs/crypto';
import { ITokenAdapter } from '@/libs/token';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

import { UserEntitySchema } from '../entity/user';
import { UserPasswordEntitySchema } from '../entity/user-password';
import { IUserRepository } from '../repository/user';

export const LoginSchema = UserEntitySchema.pick({
  email: true
}).merge(UserPasswordEntitySchema.pick({ password: true }));

export type LoginInput = z.infer<typeof LoginSchema>;
export type LoginOutput = Promise<{ token: string }>;

export class LoginUsecase implements IUsecase {
  constructor(
    private readonly loginRepository: IUserRepository,
    private readonly tokenService: ITokenAdapter,
    private readonly crypto: ICryptoAdapter
  ) {}

  @ValidateSchema(LoginSchema)
  async execute(input: LoginInput, { tracing }: ApiTrancingInput): LoginOutput {
    const login = await this.loginRepository.findOneWithRelation(
      {
        email: input.email
      },
      { password: true }
    );

    if (!login) {
      throw new ApiNotFoundException('userNotFound');
    }

    const password = this.crypto.createHash(input.password);

    if (login.password.password !== password) {
      throw new ApiNotFoundException('incorrectPassword');
    }

    tracing.logEvent('user-login', `${login}`);

    return this.tokenService.sign({
      email: login.email,
      roles: login.roles
    });
  }
}
