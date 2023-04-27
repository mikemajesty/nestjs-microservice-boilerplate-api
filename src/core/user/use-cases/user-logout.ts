import { z } from 'zod';

import { ICacheAdapter } from '@/infra/cache';
import { ISecretsAdapter } from '@/infra/secrets';
import { ValidateSchema } from '@/utils/decorators/validate-schema.decorator';

export const LogoutSchema = z.object({ token: z.string().trim().min(10) });

export type LogoutInput = z.infer<typeof LogoutSchema>;
export type LogoutOutput = Promise<void>;

export class LogoutUsecase {
  constructor(private readonly redis: ICacheAdapter, private readonly secretes: ISecretsAdapter) {}

  @ValidateSchema(LogoutSchema)
  async execute(input: LogoutInput): Promise<LogoutOutput> {
    await this.redis.set(input.token, input.token, { PX: this.secretes.TOKEN_EXPIRATION });
  }
}
