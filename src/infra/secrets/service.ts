import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ISecretsAdapter } from './adapter';

@Injectable()
export class SecretsService extends ConfigService implements ISecretsAdapter {
  constructor() {
    super();
  }

  ENV = this.get('ENV');

  PORT = this.get<number>('PORT');

  HOST = this.get('HOST');

  LOGER_LEVEL = this.get('LOGER_LEVEL');

  REDIS_URL = this.get('REDIS_URL');

  POSTGRES_URL = `postgresql://${this.get('POSTGRES_USER')}:${this.get('POSTGRES_PASSWORD')}@${this.get(
    'POSTGRES_HOST'
  )}:${this.get('POSTGRES_PORT')}/${this.get('POSTGRES_DATABASE')}`;

  MONGO_URL = this.get('MONGO_URL');

  JEAGER_URL = this.get('JEAGER_URL');

  TOKEN_EXPIRATION = this.get<number>('TOKEN_EXPIRATION');

  JWT_SECRET_KEY = this.get('JWT_SECRET_KEY');

  rabbitMQ = {
    user: this.get('RABBITMQ_USER'),
    pass: this.get('RABBITMQ_PASS'),
    port: this.get<number>('RABBITMQ_PORT'),
    host: this.get('RABBITMQ_HOST')
  };
}
