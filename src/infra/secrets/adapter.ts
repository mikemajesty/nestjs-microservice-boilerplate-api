export abstract class ISecretsAdapter {
  ENV: string;

  PORT: number;

  HOST: string;

  LOG_LEVEL: string;

  MONGO_URL: string;

  POSTGRES_URL: string;

  REDIS_URL: string;

  TOKEN_EXPIRATION: number;

  rabbitMQ: {
    user: string;
    pass: string;
    host: string;
    port: number;
  };
}
