import { z } from 'zod';

import { IUserRepository } from '@/core/user/repository/user';
import { ICryptoAdapter } from '@/libs/crypto';
import { IEventAdapter } from '@/libs/event';
import { EventNameEnum } from '@/libs/event/types';
import { ITokenAdapter } from '@/libs/token';
import { ValidateSchema } from '@/utils/decorators';
import { ApiBadRequestException, ApiNotFoundException, ApiUnauthorizedException } from '@/utils/exception';
import { IUsecase } from '@/utils/usecase';

import { IResetPasswordRepository } from '../repository/reset-password';

export const ConfirmResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(5).max(200),
  confirmPassword: z.string().min(5).max(200)
});

export type ConfirmResetPasswordInput = z.infer<typeof ConfirmResetPasswordSchema>;
export type ConfirmResetPasswordOutput = void;

export class ConfirmResetPasswordUsecase implements IUsecase {
  constructor(
    private readonly resetpasswordtokenRepository: IResetPasswordRepository,
    private readonly userRepository: IUserRepository,
    private readonly token: ITokenAdapter,
    private readonly event: IEventAdapter,
    private readonly crypto: ICryptoAdapter
  ) {}

  @ValidateSchema(ConfirmResetPasswordSchema)
  async execute(input: ConfirmResetPasswordInput): Promise<ConfirmResetPasswordOutput> {
    const samePassword = input.password === input.confirmPassword;

    if (!samePassword) {
      throw new ApiBadRequestException('passwords are different');
    }

    const token = await this.token.verify<{ id: string }>(input.token);

    const user = await this.userRepository.findOne({ id: token.id });

    if (!user) {
      throw new ApiNotFoundException('user not found');
    }

    const resetpasswordtoken = await this.resetpasswordtokenRepository.findOne({ userId: user.id });

    if (!resetpasswordtoken) {
      throw new ApiUnauthorizedException('token was expired');
    }

    await this.resetpasswordtokenRepository.remove({ userId: user.id });

    user.password = this.crypto.createHash(input.password);
    await this.userRepository.updateOne({ id: user.id }, user);

    this.event.emit(EventNameEnum.SEND_EMAIL, {
      email: user.email,
      subject: 'Password has been changed successfully',
      template: 'reset-password',
      payload: { name: user.email }
    });
  }
}
