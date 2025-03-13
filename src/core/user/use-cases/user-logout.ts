import { ICacheAdapter } from '@/infra/cache';
import { ISecretsAdapter } from '@/infra/secrets';
import { ValidateSchema } from '@/utils/decorators';
import { ApiTrancingInput } from '@/utils/request';
import { IUsecase } from '@/utils/usecase';
import { Infer, InputValidator } from '@/utils/validator';

export const LogoutSchema = InputValidator.object({ token: InputValidator.string().trim().min(10) });

export class LogoutUsecase implements IUsecase {
  constructor(
    private readonly redis: ICacheAdapter,
    private readonly secretes: ISecretsAdapter
  ) {}

  @ValidateSchema(LogoutSchema)
  async execute(input: LogoutInput, { tracing, user }: ApiTrancingInput): LogoutOutput {
    await this.redis.set(input.token, input.token, { PX: this.secretes.TOKEN_EXPIRATION });

    tracing.logEvent('user-logout', `${user.email}`);
  }
}

export type LogoutInput = Infer<typeof LogoutSchema>;
export type LogoutOutput = Promise<void>;
