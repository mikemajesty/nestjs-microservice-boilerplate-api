import { Module } from '@nestjs/common';

import { ISecretsAdapter, SecretsModule } from '../secrets';
import { ILoggerAdapter } from './adapter';
import { LoggerService } from './service';

@Module({
  imports: [SecretsModule],
  providers: [
    {
      provide: ILoggerAdapter,
      useFactory: ({ LOG_LEVEL, ELK_URL }: ISecretsAdapter) => {
        const logger = new LoggerService(ELK_URL);
        logger.connect(LOG_LEVEL);
        return logger;
      },
      inject: [ISecretsAdapter]
    }
  ],
  exports: [ILoggerAdapter]
})
export class LoggerModule {}
