import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ISecretsAdapter } from './adapter';
import { EnvEnum } from './types';

@Injectable()
export class SecretsService implements ISecretsAdapter {
  constructor(private readonly config: ConfigService) {}

  IS_LOCAL = this.config.get<EnvEnum>('NODE_ENV') === EnvEnum.LOCAL;

  IS_PRODUCTION = this.config.get<EnvEnum>('NODE_ENV') === EnvEnum.PRD;

  SYNC_DATABASE = this.config.get('SYNC_DATABASE') === 'true';

  ENV = this.config.get<EnvEnum>('NODE_ENV');

  PORT = this.config.get<number>('PORT');

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

  EMAIL = {
    HOST: this.config.get('EMAIL_HOST'),
    PORT: Number(this.config.get('EMAIL_PORT')),
    USER: this.config.get('EMAIL_USER'),
    PASS: this.config.get('EMAIL_PASS'),
    FROM: this.config.get('EMAIL_FROM')
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
  REFRESH_TOKEN_EXPIRATION = this.config.get<number | string>('REFRESH_TOKEN_EXPIRATION');

  JWT_SECRET_KEY = this.config.get('JWT_SECRET_KEY');

  AUTH = {
    GOOGLE: {
      CLIENT_ID: this.config.get('GOOGLE_CLIENT_ID'),
      CLIENT_SECRET: this.config.get('GOOGLE_CLIENT_SECRET'),
      REDIRECT_URL: this.config.get('GOOGLE_REDIRECT_URI')
    }
  };
}
