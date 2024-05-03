import { z } from 'zod';

import { ValidateSchema } from '@/common/decorators';
import { ITokenAdapter } from '@/libs/auth';
import { ICryptoAdapter } from '@/libs/crypto';
import { ApiNotFoundException } from '@/utils/exception';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

import { UserEntitySchema } from '../entity/user';
import { IUserRepository } from '../repository/user';

export const LoginSchema = UserEntitySchema.pick({
  login: true,
  password: true
});

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
    const password = this.crypto.createHash(input.password);
    const login = await this.loginRepository.findOne({
      login: input.login,
      password
    });

    if (!login) {
      throw new ApiNotFoundException();
    }

    tracing.logEvent('user-login', `${login.login}`);

    return this.tokenService.sign({
      login: login.login,
      roles: login.roles
    });
  }
}
