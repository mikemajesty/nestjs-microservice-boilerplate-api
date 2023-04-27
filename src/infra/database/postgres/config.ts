import { ConfigService } from '@nestjs/config';
import { blue, gray } from 'colorette';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';
import { Sequelize } from 'sequelize-typescript';

import { CatsSchema } from '@/infra/database/postgres/schemas/cats';

config();

const configService = new ConfigService();

const connection = `postgresql://${configService.get('POSTGRES_USER')}:${configService.get(
  'POSTGRES_PASSWORD'
)}@${configService.get('POSTGRES_HOST')}:${configService.get('POSTGRES_PORT')}/${configService.get(
  'POSTGRES_DATABASE'
)}`;

const sequelizeConfig = new Sequelize(connection, {
  dialect: 'postgres',
  logging: (msm) => console.log(blue('[sequelize]'), gray(msm))
});

sequelizeConfig.addModels([CatsSchema]);

export { sequelizeConfig };

const databaseConfigMap = {
  DEV: 'development',
  TEST: 'test',
  PRD: 'production'
}[configService.get('ENV')];

const postgresConfig = sequelizeConfig.config.dialectOptions;

writeFileSync(
  'database.json',
  JSON.stringify({
    [databaseConfigMap]: { ...postgresConfig, username: postgresConfig['user'], user: undefined, dialect: 'postgres' }
  })
);
