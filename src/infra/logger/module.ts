import { forwardRef, Module } from '@nestjs/common';

import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';

import { ILoggerAdapter } from './adapter';
import { LoggerService } from './service';
import { LogLevelEnum } from './types';

@Module({
  imports: [forwardRef(() => SecretsModule)],
  providers: [
    {
      provide: ILoggerAdapter,
      useFactory: async ({ LOG_LEVEL }: ISecretsAdapter) => {
        const logger = new LoggerService();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await logger.connect((LogLevelEnum as any)[`${LOG_LEVEL}`]);
        return logger;
      },
      inject: [ISecretsAdapter]
    }
  ],
  exports: [ILoggerAdapter]
})
export class LoggerModule {}
