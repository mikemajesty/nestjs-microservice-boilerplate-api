import { ConfigService } from '@nestjs/config';
import { blue, gray } from 'colorette';
import { config } from 'dotenv';
import { Sequelize } from 'sequelize-typescript';

import { CatSchema } from '@/infra/database/sequelize/schemas/cats';

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

sequelizeConfig.addModels([CatSchema]);

export { sequelizeConfig };
