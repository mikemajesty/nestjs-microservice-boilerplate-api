import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { red } from 'colorette';
import { Connection } from 'mongoose';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { ISecretsAdapter, SecretsModule } from '@/infra/secrets';

import { name } from '../../../../package.json';
import { ConnectionName } from '../enum';
import { MongoService } from './service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      connectionName: ConnectionName.USER,
      useFactory: ({ MONGO_URL }: ISecretsAdapter, logger: ILoggerAdapter) => {
        const connection = new MongoService().getConnection({ URI: MONGO_URL });
        return {
          connectionFactory: (connection: Connection) => {
            if (connection.readyState === 1) {
              logger.log('🎯 mongo connected successfully!');
            }
            connection.on('disconnected', () => {
              logger.log(red('mongo disconnected!\n'));
              process.exit(1);
            });
            connection.on('reconnected', () => {
              logger.log(red('mongo reconnected!\n'));
            });
            connection.on('error', (error) => {
              error.context = 'MongoConnection';
              logger.error(error);
            });

            return connection;
          },
          uri: connection.uri,
          appName: name
        };
      },
      imports: [SecretsModule, LoggerModule],
      inject: [ISecretsAdapter, ILoggerAdapter]
    })
  ]
})
export class MongoDatabaseModule {}
