export abstract class ISecretsAdapter {
  ENV: string;

  PORT: number;

  HOST: string;

  LOGER_LEVEL: string;

  MONGO_URL: string;

  POSTGRES_URL: string;

  REDIS_URL: string;

  JEAGER_URL: string;

  TOKEN_EXPIRATION: number;

  JWT_SECRET_KEY: string;

  rabbitMQ: {
    user: string;
    pass: string;
    host: string;
    port: number;
  };
}
