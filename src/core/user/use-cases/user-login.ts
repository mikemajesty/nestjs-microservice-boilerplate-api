import { ITokenAdapter } from '@/libs/token';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { ApiTrancingInput, UserRequest } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';
import { UUIDUtils } from '@/utils/uuid';
import { Infer } from '@/utils/validator';

import { UserEntitySchema } from '../entity/user';
import { UserPasswordEntity, UserPasswordEntitySchema } from '../entity/user-password';
import { IUserRepository } from '../repository/user';

export const LoginSchema = UserEntitySchema.pick({
  email: true
}).merge(UserPasswordEntitySchema.pick({ password: true }));

export class LoginUsecase implements IUsecase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenAdapter
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

    const passwordEntity = new UserPasswordEntity({ id: UUIDUtils.create(), password: input.password });

    passwordEntity.createPassword();

    passwordEntity.verifyPassword(user.password.password);

    tracing.logEvent('user-login', `${user}`);

    const { token } = this.tokenService.sign({
      email: user.email,
      name: user.name,
      id: user.id
    } as UserRequest);

    const { token: refreshToken } = this.tokenService.sign({ userId: user.id });

    return { accessToken: token, refreshToken };
  }
}

export type LoginInput = Infer<typeof LoginSchema>;
export type LoginOutput = { accessToken: string; refreshToken: string };
