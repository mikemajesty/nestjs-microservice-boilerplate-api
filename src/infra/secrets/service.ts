import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ISecretsAdapter } from './adapter';

@Injectable()
export class SecretsService implements ISecretsAdapter {
  constructor(private readonly config: ConfigService) {}

  ENV = this.config.get('ENV');

  PORT = this.config.get<number>('PORT');

  HOST = this.config.get('HOST');

  LOG_LEVEL = this.config.get('LOG_LEVEL');

  REDIS_URL = this.config.get('REDIS_URL');

  POSTGRES_URL = `postgresql://${this.config.get('POSTGRES_USER')}:${this.config.get(
    'POSTGRES_PASSWORD'
  )}@${this.config.get('POSTGRES_HOST')}:${this.config.get('POSTGRES_PORT')}/${this.config.get('POSTGRES_DATABASE')}`;

  MONGO_URL = this.config.get('MONGO_URL');

  ZIPKIN_URL = this.config.get('ZIPKIN_URL');

  PROMETHUES_URL = this.config.get('PROMETHUES_URL');

  TOKEN_EXPIRATION = this.config.get<number>('TOKEN_EXPIRATION');

  JWT_SECRET_KEY = this.config.get('JWT_SECRET_KEY');

  RATE_LIMIT_BY_USER = this.config.get<number>('RATE_LIMIT_BY_USER');

  MONGO_EXPRESS_URL = this.config.get('MONGO_EXPRESS_URL');

  PGADMIN_URL = this.config.get('PGADMIN_URL');
}
