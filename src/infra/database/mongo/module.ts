import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { red } from 'colorette';
import { Connection } from 'mongoose';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';
import { ApiInternalServerException } from '@/utils/exception';

import { name } from '../../../../package.json';
import { ConnectionName } from '../enum';
import { MongoService } from './service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      connectionName: ConnectionName.CATS,
      useFactory: ({ MONGO: { MONGO_URL }, IS_PRODUCTION }: ISecretsAdapter, logger: ILoggerAdapter) => {
        const connection = new MongoService().getConnection({ URI: MONGO_URL });
        return {
          connectionFactory: async (connection: Connection) => {
            if (connection.readyState === 1) {
              if (connection.db && !IS_PRODUCTION) {
                await connection.db.setProfilingLevel('slow_only');
                await connection.db.command({
                  profile: 1,
                  slowms: 200
                });
              }
              logger.log('🎯 mongo connected successfully!');
            }
            connection.on('disconnected', () => {
              logger.error(new ApiInternalServerException('mongo disconnected!'));
            });
            connection.on('reconnected', () => {
              logger.log(red('mongo reconnected!\n'));
            });
            connection.on('error', (error) => {
              logger.fatal(new ApiInternalServerException(error.message || error, { context: 'MongoConnection' }));
            });

            return connection;
          },
          uri: connection.uri,
          minPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 5000,
          readPreference: 'secondaryPreferred',
          appName: name
        };
      },
      inject: [ISecretsAdapter, ILoggerAdapter],
      imports: [SecretsModule, LoggerModule]
    })
  ]
})
export class MongoDatabaseModule {}
