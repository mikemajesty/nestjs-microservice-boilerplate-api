export abstract class ISecretsAdapter {
  ENV!: string;

  PORT!: number | string;

  HOST!: string;

  LOG_LEVEL!: string;

  DATE_FORMAT!: string;

  TZ!: string;

  MONGO!: {
    MONGO_URL: string;
    MONGO_DATABASE: string;
    MONGO_EXPRESS_URL: string;
  };

  POSTGRES!: {
    POSTGRES_URL: string;
    POSTGRES_PGADMIN_URL: string;
  };

  EMAIL!: {
    HOST: string;
    PORT: number;
    USER: string;
    PASS: string;
    FROM: string;
  };

  REDIS_URL!: string;

  ZIPKIN_URL!: string;

  PROMETHUES_URL!: string;
  GRAFANA_URL!: string;

  TOKEN_EXPIRATION!: number | string;
  REFRESH_TOKEN_EXPIRATION!: number | string;

  JWT_SECRET_KEY!: string;

  IS_LOCAL!: boolean;

  IS_PRODUCTION!: boolean;

  AUTH!: {
    GOOGLE: {
      CLIENT_ID: string;
      CLIENT_SECRET: string;
      REDIRECT_URL: string;
    };
  };
}
