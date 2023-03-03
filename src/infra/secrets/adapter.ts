export abstract class ISecretsAdapter {
  ENV: string;

  PORT: number;

  HOST: string;

  LOG_LEVEL: string;

  MONGO_URL: string;

  ELK_URL: string;

  KIBANA_URL: string;

  POSTGRES_URL: string;
  POSTGRES_SCHEMA: string;

  REDIS_URL: string;

  TOKEN_EXPIRATION: number;

  SIGEF_BASE_URL: string;

  POLYGON_BASE_URL: string;

  QUEUE_SENT_AREAS: string;
  QUEUE_PROCESSED_AREAS: string;

  BUCKET_ENV: string;

  rabbitMQ: {
    user: string;
    pass: string;
    host: string;
    port: number;
  };

  aws: {
    region: string;
    accessKey: string;
    secretkey: string;
  };
}
