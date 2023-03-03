import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ISecretsAdapter } from './adapter';

@Injectable()
export class SecretsService extends ConfigService implements ISecretsAdapter {
  constructor() {
    super();
  }

  REDIS_URL = this.get('REDIS_URL');

  PORT = this.get<number>('PORT');

  ENV = this.get('ENV');

  HOST = this.get('HOST');

  LOG_LEVEL = this.get('LOG_LEVEL');

  POSTGRES_URL = `postgresql://${this.get('POSTGRES_USER')}:${this.get('POSTGRES_PASSWORD')}@${this.get(
    'POSTGRES_HOST'
  )}:${this.get('POSTGRES_PORT')}/${this.get('POSTGRES_DATABASE')}`;

  POSTGRES_SCHEMA = this.get('POSTGRES_SCHEMA');

  MONGO_URL = this.get('MONGO_URL');

  ELK_URL = this.get('ELK_URL');

  KIBANA_URL = this.get('KIBANA_URL');

  TOKEN_EXPIRATION = this.get<number>('TOKEN_EXPIRATION');

  SIGEF_BASE_URL = this.get('SIGEF_BASE_URL');

  POLYGON_BASE_URL = this.get('POLYGON_BASE_URL');

  QUEUE_SENT_AREAS = this.get('QUEUE_SENT_AREAS');

  QUEUE_PROCESSED_AREAS = this.get('QUEUE_PROCESSED_AREAS');

  rabbitMQ = {
    user: this.get('RABBITMQ_USER'),
    pass: this.get('RABBITMQ_PASS'),
    port: this.get<number>('RABBITMQ_PORT'),
    host: this.get('RABBITMQ_HOST')
  };

  BUCKET_ENV = this.get('BUCKET_ENV');

  aws = {
    region: this.get('AWS_BUCKET_REGION'),
    accessKey: this.get('AWS_BUCKET_ACCESS_KEY_ID'),
    secretkey: this.get('AWS_BUCKET_SECRET_ACCESS_KEY')
  };
}
