import { z } from 'zod';

import { ICryptoAdapter } from '@/libs/crypto';
import { ITokenAdapter } from '@/libs/token';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { ApiTrancingInput, UserRequest } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';

import { UserEntitySchema } from '../entity/user';
import { UserPasswordEntitySchema } from '../entity/user-password';
import { IUserRepository } from '../repository/user';

export const LoginSchema = UserEntitySchema.pick({
  email: true
}).merge(UserPasswordEntitySchema.pick({ password: true }));

export type LoginInput = z.infer<typeof LoginSchema>;
export type LoginOutput = { accessToken: string; refreshToken: string };

export class LoginUsecase implements IUsecase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenAdapter,
    private readonly crypto: ICryptoAdapter
  ) {}

  @ValidateSchema(LoginSchema)
  async execute(input: LoginInput, { tracing }: ApiTrancingInput): Promise<LoginOutput> {
    const user = await this.userRepository.findOneWithRelation(
      {
        email: input.email
      },
      { password: true }
    );

    if (!user) {
      throw new ApiNotFoundException('userNotFound');
    }

    if (!user.roles.length) {
      throw new ApiNotFoundException('roleNotFound');
    }

    const password = this.crypto.createHash(input.password);

    if (user.password.password !== password) {
      throw new ApiNotFoundException('incorrectPassword');
    }

    tracing.logEvent('user-login', `${user}`);

    const { token } = this.tokenService.sign({
      email: user.email,
      name: user.name,
      roles: user.roles.map((r) => r.name)
    } as UserRequest);

    const { token: refreshToken } = this.tokenService.sign({ userId: user.id });

    return { accessToken: token, refreshToken };
  }
}
