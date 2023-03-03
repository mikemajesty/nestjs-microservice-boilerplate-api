import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ISecretsAdapter } from './adapter';
import { SecretsService } from './service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env']
    })
  ],
  providers: [
    {
      provide: ISecretsAdapter,
      useClass: SecretsService
    }
  ],
  exports: [ISecretsAdapter]
})
export class SecretsModule {}
