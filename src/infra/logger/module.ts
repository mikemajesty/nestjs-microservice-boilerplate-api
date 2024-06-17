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
        await logger.connect(LogLevelEnum[`${LOG_LEVEL}`]);
        return logger;
      },
      inject: [ISecretsAdapter]
    }
  ],
  exports: [ILoggerAdapter]
})
export class LoggerModule {}
