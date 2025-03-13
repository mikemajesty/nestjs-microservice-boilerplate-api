import { UserPasswordEntity } from '@/core/user/entity/user-password';
import { IUserRepository } from '@/core/user/repository/user';
import { SendEmailInput } from '@/infra/email';
import { IEventAdapter } from '@/libs/event';
import { EventNameEnum } from '@/libs/event/types';
import { ITokenAdapter } from '@/libs/token';
import { ValidateSchema } from '@/utils/decorators';
import { ApiBadRequestException, ApiNotFoundException, ApiUnauthorizedException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';
import { Infer, InputValidator } from '@/utils/validator';

import { IResetPasswordRepository } from '../repository/reset-password';

export const ResetPasswordConfirmSchema = InputValidator.object({
  token: InputValidator.string(),
  password: InputValidator.string().min(5).max(200),
  confirmPassword: InputValidator.string().min(5).max(200)
});

export class ResetPasswordConfirmUsecase implements IUsecase {
  constructor(
    private readonly resetPasswordTokenRepository: IResetPasswordRepository,
    private readonly userRepository: IUserRepository,
    private readonly token: ITokenAdapter,
    private readonly event: IEventAdapter
  ) {}

  @ValidateSchema(ResetPasswordConfirmSchema)
  async execute(input: ResetPasswordConfirmInput): Promise<ResetPasswordConfirmOutput> {
    const samePassword = input.password === input.confirmPassword;

    if (!samePassword) {
      throw new ApiBadRequestException('passwords are different');
    }

    const token = await this.token.verify<ResetPasswordConfirmVerify>(input.token);

    const user = await this.userRepository.findOneWithRelation({ id: token.id }, { password: true });

    if (!user) {
      throw new ApiNotFoundException('user not found');
    }

    const resetPasswordToken = await this.resetPasswordTokenRepository.findByIdUserId(user.id);

    if (!resetPasswordToken) {
      throw new ApiUnauthorizedException('token was expired');
    }

    const passwordEntity = new UserPasswordEntity(user.password);

    passwordEntity.createPassword();

    await this.userRepository.create(user);

    this.event.emit<SendEmailInput>(EventNameEnum.SEND_EMAIL, {
      email: user.email,
      subject: 'Password has been changed successfully',
      template: 'reset-password',
      payload: { name: user.name }
    });

    await this.resetPasswordTokenRepository.remove({ userId: user.id });
  }
}

export type ResetPasswordConfirmInput = Infer<typeof ResetPasswordConfirmSchema>;
export type ResetPasswordConfirmOutput = void;

export type ResetPasswordConfirmVerify = {
  id: string;
};
