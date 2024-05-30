import { Module } from '@nestjs/common';
import nodemailer from 'nodemailer';

import { ILoggerAdapter, LoggerModule } from '../logger';
import { ISecretsAdapter, SecretsModule } from '../secrets';
import { IEmailAdapter } from './adapter';
import { EmailService } from './service';

@Module({
  imports: [SecretsModule, LoggerModule],
  providers: [
    {
      provide: IEmailAdapter,
      useFactory: (secret: ISecretsAdapter, logger: ILoggerAdapter) => {
        const transporter = nodemailer.createTransport({
          host: secret.EMAIL.HOST,
          port: secret.EMAIL.PORT,
          auth: {
            user: secret.EMAIL.USER,
            pass: secret.EMAIL.PASS
          }
        });
        return new EmailService(secret, logger, transporter);
      },
      inject: [ISecretsAdapter, ILoggerAdapter]
    }
  ],
  exports: [IEmailAdapter]
})
export class EmailModule {}
