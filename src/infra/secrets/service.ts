import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ISecretsAdapter } from './adapter';
import { EnvEnum } from './types';

@Injectable()
export class SecretsService implements ISecretsAdapter {
  constructor(private readonly config: ConfigService) {}

  IS_LOCAL = this.config.get<EnvEnum>('NODE_ENV') === EnvEnum.LOCAL;

  IS_PRODUCTION = this.config.get<EnvEnum>('NODE_ENV') === EnvEnum.PRD;

  ENV = this.config.get<EnvEnum>('NODE_ENV');

  PORT = Number(this.config.get<number>('PORT'));

  HOST = this.config.get('HOST');

  LOG_LEVEL = this.config.get('LOG_LEVEL');

  DATE_FORMAT = this.config.get('DATE_FORMAT');

  TZ = this.config.get('TZ');

  REDIS_URL = this.config.get('REDIS_URL');

  MONGO = {
    MONGO_URL: this.config.get('MONGO_URL'),
    MONGO_DATABASE: this.config.get('MONGO_DATABASE'),
    MONGO_EXPRESS_URL: this.config.get('MONGO_EXPRESS_URL')
  };

  POSTGRES = {
    POSTGRES_URL: `postgresql://${this.config.get('POSTGRES_USER')}:${this.config.get(
      'POSTGRES_PASSWORD'
    )}@${this.config.get('POSTGRES_HOST')}:${this.config.get('POSTGRES_PORT')}/${this.config.get('POSTGRES_DATABASE')}`,
    POSTGRES_PGADMIN_URL: this.config.get('PGADMIN_URL')
  };

  ZIPKIN_URL = this.config.get('ZIPKIN_URL');

  PROMETHUES_URL = this.config.get('PROMETHUES_URL');

  TOKEN_EXPIRATION = this.config.get<number | string>('TOKEN_EXPIRATION');

  JWT_SECRET_KEY = this.config.get('JWT_SECRET_KEY');

  RATE_LIMIT_BY_USER = Number(this.config.get<number>('RATE_LIMIT_BY_USER'));
}
