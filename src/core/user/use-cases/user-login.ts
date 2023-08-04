import { z } from 'zod';

import { ITokenAdapter } from '@/libs/auth';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';

import { UserEntitySchema } from '../entity/user';
import { IUserRepository } from '../repository/user';

export const LoginSchema = UserEntitySchema.pick({
  login: true,
  password: true
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type LoginOutput = Promise<{ token: string }>;

export class LoginUsecase {
  constructor(private readonly loginRepository: IUserRepository, private readonly tokenService: ITokenAdapter) {}

  @ValidateSchema(LoginSchema)
  async execute(input: LoginInput): LoginOutput {
    const login = await this.loginRepository.findOne({
      login: input.login,
      password: input.password
    });

    if (!login) {
      throw new ApiNotFoundException();
    }

    return this.tokenService.sign({
      login: login.login,
      password: login.password,
      roles: login.roles
    });
  }
}
