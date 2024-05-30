import { ConfirmResetPasswordInput, ConfirmResetPasswordOutput } from '@/core/reset-password/use-cases/confirm';
import { SendEmailResetPasswordInput, SendEmailResetPasswordOutput } from '@/core/reset-password/use-cases/send-email';
import { IUsecase } from '@/utils/usecase';

export abstract class ISendEmailResetPasswordAdapter implements IUsecase {
  abstract execute(input: SendEmailResetPasswordInput): Promise<SendEmailResetPasswordOutput>;
}

export abstract class IConfirmResetPasswordAdapter implements IUsecase {
  abstract execute(input: ConfirmResetPasswordInput): Promise<ConfirmResetPasswordOutput>;
}
