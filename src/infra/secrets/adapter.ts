export abstract class ISecretsAdapter {
  ENV: string;

  PORT: number;

  HOST: string;

  LOG_LEVEL: string;

  DATE_FORMAT: string;

  TZ: string;

  MONGO: {
    MONGO_URL?: string;
    MONGO_DATABASE?: string;
    MONGO_EXPRESS_URL?: string;
  };

  POSTGRES: {
    POSTGRES_URL?: string;
    POSTGRES_PGADMIN_URL?: string;
  };

  REDIS_URL: string;

  ZIPKIN_URL: string;

  PROMETHUES_URL: string;

  TOKEN_EXPIRATION: number | string;

  RATE_LIMIT_BY_USER: number;

  JWT_SECRET_KEY: string;

  IS_LOCAL: boolean;

  IS_PRODUCTION: boolean;
}
