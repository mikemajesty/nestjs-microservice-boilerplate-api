import {
  ResetPasswordConfirmInput,
  ResetPasswordConfirmOutput
} from '@/core/reset-password/use-cases/reset-password-confirm';
import {
  ResetPasswordSendEmailInput,
  ResetPasswordSendEmailOutput
} from '@/core/reset-password/use-cases/reset-password-send-email';
import { IUsecase } from '@/utils/usecase';

export abstract class ISendEmailResetPasswordAdapter implements IUsecase {
  abstract execute(input: ResetPasswordSendEmailInput): Promise<ResetPasswordSendEmailOutput>;
}

export abstract class IConfirmResetPasswordAdapter implements IUsecase {
  abstract execute(input: ResetPasswordConfirmInput): Promise<ResetPasswordConfirmOutput>;
}
