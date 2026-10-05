/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/secrets.md
 */
import { ConfigService } from '@nestjs/config'

import { ISecretsAdapter } from './adapter'
import { EnvEnum } from './types'

export class SecretsService {
  constructor(private readonly config: ConfigService) {}

  build(): ISecretsAdapter {
    return {
      ENV: this.get('NODE_ENV'),
      HTTP_REQUEST_TIMEOUT_MS: this.get<number>('HTTP_REQUEST_TIMEOUT_MS'),
      PORT: this.get<number>('PORT'),
      HOST: this.get('HOST'),
      LOG_LEVEL: this.get('LOG_LEVEL'),
      DATE_FORMAT: this.get('DATE_FORMAT'),
      MONGO: {
        MONGO_URL: this.get('MONGO_URL'),
        MONGO_DATABASE: this.get('MONGO_DATABASE'),
        MONGO_EXPRESS_URL: this.get('MONGO_EXPRESS_URL')
      },
      POSTGRES: {
        POSTGRES_URL: this.getPostgresUrl(),
        POSTGRES_PGADMIN_URL: this.get('PGADMIN_URL')
      },
      EMAIL: {
        HOST: this.get('EMAIL_HOST'),
        PORT: this.get<number>('EMAIL_PORT'),
        USER: this.get('EMAIL_USER'),
        PASS: this.get('EMAIL_PASS'),
        FROM: this.get('EMAIL_FROM')
      },
      REDIS_URL: this.get('REDIS_URL'),
      ZIPKIN_URL: this.get('ZIPKIN_URL'),
      PROMETHUES_URL: this.get('PROMETHUES_URL'),
      GRAFANA_URL: this.get('GRAFANA_URL'),
      TOKEN_EXPIRATION: this.get<number>('TOKEN_EXPIRATION'),
      REFRESH_TOKEN_EXPIRATION: this.get<number>('REFRESH_TOKEN_EXPIRATION'),
      JWT_SECRET_KEY: this.get('JWT_SECRET_KEY'),
      JWT_REFRESH_SECRET_KEY: this.get('JWT_REFRESH_SECRET_KEY'),
      IS_LOCAL: this.get('NODE_ENV') === EnvEnum.LOCAL,
      IS_DOCUMENTDB: this.get('IS_DOCUMENTDB') === 'true',
      IS_PRODUCTION: this.get('NODE_ENV') === EnvEnum.PRD,
      AUTH: {
        GOOGLE: {
          CLIENT_ID: this.get('GOOGLE_CLIENT_ID'),
          CLIENT_SECRET: this.get('GOOGLE_CLIENT_SECRET'),
          REDIRECT_URL: this.get('GOOGLE_REDIRECT_URI')
        }
      }
    }
  }

  private get<T = string>(key: string): T {
    return this.config.get<T>(key) as T
  }

  private getPostgresUrl(): string {
    return (
      this.get('POSTGRES_URL') ||
      `postgresql://${this.get('POSTGRES_USER')}:${this.get('POSTGRES_PASSWORD')}@${this.get(
        'POSTGRES_HOST'
      )}:${this.get('POSTGRES_PORT')}/${this.get('POSTGRES_DATABASE')}`
    )
  }
}
