import { z } from 'zod';

import { ValidateSchema } from '@/common/decorators';
import { ICryptoAdapter } from '@/libs/crypto';
import { ITokenAdapter } from '@/libs/token';
import { ApiNotFoundException } from '@/utils/exception';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

import { UserEntitySchema } from '../entity/user';
import { IUserRepository } from '../repository/user';

export const LoginSchema = UserEntitySchema.pick({
  email: true,
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
      email: input.email,
      password
    });

    if (!login) {
      throw new ApiNotFoundException();
    }

    tracing.logEvent('user-login', `${login.email}`);

    return this.tokenService.sign({
      email: login.email,
      roles: login.roles
    });
  }
}
