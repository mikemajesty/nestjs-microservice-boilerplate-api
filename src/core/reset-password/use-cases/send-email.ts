import { z } from 'zod';

import { UserEntitySchema } from '@/core/user/entity/user';
import { IUserRepository } from '@/core/user/repository/user';
import { SendEmailInput } from '@/infra/email';
import { ISecretsAdapter } from '@/infra/secrets';
import { IEventAdapter } from '@/libs/event';
import { EventNameEnum } from '@/libs/event/types';
import { ITokenAdapter } from '@/libs/token';
import { ValidateSchema } from '@/utils/decorators';
import { ApiNotFoundException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';

import { ResetPasswordEntity } from '../entity/reset-password';
import { IResetPasswordRepository } from '../repository/reset-password';

export const SendEmailResetPasswordSchema = UserEntitySchema.pick({
  email: true
});

export type SendEmailResetPasswordInput = z.infer<typeof SendEmailResetPasswordSchema>;
export type SendEmailResetPasswordOutput = void;

export class SendEmailResetPasswordUsecase implements IUsecase {
  constructor(
    private readonly resetPasswordRepository: IResetPasswordRepository,
    private readonly userRepository: IUserRepository,
    private readonly token: ITokenAdapter,
    private readonly event: IEventAdapter,
    private readonly secret: ISecretsAdapter
  ) {}

  @ValidateSchema(SendEmailResetPasswordSchema)
  async execute({ email }: SendEmailResetPasswordInput): Promise<SendEmailResetPasswordOutput> {
    const user = await this.userRepository.findOne({ email });

    if (!user) {
      throw new ApiNotFoundException('user not found');
    }

    const resetPassword = await this.resetPasswordRepository.findByIdUserId(user.id);

    if (resetPassword) {
      this.event.emit<SendEmailInput>(EventNameEnum.SEND_EMAIL, {
        email: user.email,
        subject: 'Reset password',
        template: 'reque-reset-password',
        payload: { name: user.email, link: `${this.secret.HOST}/api/v1/reset-password/${resetPassword.token}` }
      });
      return;
    }

    const hash = this.token.sign({ id: user.id });
    const entity = new ResetPasswordEntity({ token: hash.token, user: user });

    await this.resetPasswordRepository.create(entity);
    this.event.emit<SendEmailInput>(EventNameEnum.SEND_EMAIL, {
      email: user.email,
      subject: 'Reset password',
      template: 'reque-reset-password',
      payload: { name: user.email, link: `${this.secret.HOST}/api/v1/reset-password/${hash.token}` }
    });
  }
}
