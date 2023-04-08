import { ICacheAdapter } from '@/infra/cache';
import { ISecretsAdapter } from '@/infra/secrets';
import { LogoutInput, LogoutOutput, LogoutSchema } from '@/modules/logout/types';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';

export class LogoutUsecase {
  constructor(private readonly redis: ICacheAdapter, private readonly secretes: ISecretsAdapter) {}

  @ValidateSchema(LogoutSchema)
  async execute(input: LogoutInput): Promise<LogoutOutput> {
    await this.redis.set(input.token, input.token, { PX: this.secretes.TOKEN_EXPIRATION });
  }
}
