import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';

import { ConnectionName } from '../enum';
import { MongoService } from './service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      connectionName: ConnectionName.USER,
      useFactory: ({ MONGO_URL }: ISecretsAdapter) => {
        return new MongoService().getConnection({ URI: MONGO_URL });
      },
      imports: [SecretsModule],
      inject: [ISecretsAdapter]
    })
  ]
})
export class MongoDatabaseModule {}
