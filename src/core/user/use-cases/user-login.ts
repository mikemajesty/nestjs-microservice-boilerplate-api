import { ITokenAdapter } from '@/libs/auth';
import { LoginInput, LoginOutput, LoginSchema } from '@/modules/login/types';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';
import { ApiNotFoundException } from '@/utils/exception';

import { IUserRepository } from '../repository/user';

export class LoginUsecase {
  constructor(private readonly loginRepository: IUserRepository, private readonly tokenService: ITokenAdapter) {}

  @ValidateSchema(LoginSchema)
  async execute(input: LoginInput): Promise<LoginOutput> {
    const login = await this.loginRepository.findOne({
      clientId: input.clientId,
      clientSecret: input.clientSecret
    });

    if (!login) {
      throw new ApiNotFoundException('userNotFound');
    }

    return this.tokenService.sign({
      clientId: login.clientId,
      clientSecret: login.clientSecret,
      organization: login.organization,
      roles: login.roles
    });
  }
}
