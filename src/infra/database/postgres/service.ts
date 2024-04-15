import { blue, bold, gray } from 'colorette';
import { Sequelize } from 'sequelize-typescript';

import { ILoggerAdapter } from '@/infra/logger';
import { ISecretsAdapter } from '@/infra/secrets';

import { name } from '../../../../package.json';
import { IDataBaseAdapter } from '../adapter';
import { ConnectionType } from '../types';
import { CatsSchema } from './schemas/cats';

export class SequelizeService implements IDataBaseAdapter {
  private sequelize: Sequelize;
  constructor(
    private readonly secret: ISecretsAdapter,
    private readonly logger: ILoggerAdapter
  ) {}

  getConnection<TOpt = unknown & { url: string }>({ URI }: ConnectionType): TOpt {
    return {
      type: 'postgres',
      url: URI,
      database: name
    } as TOpt;
  }

  async connect(): Promise<Sequelize> {
    try {
      const dialect = 'postgres';
      const instance = new Sequelize(this.secret.POSTGRES.POSTGRES_URL, {
        dialect: dialect,
        benchmark: true,
        timezone: process.env.TZ,
        define: { underscored: true },
        // eslint-disable-next-line no-console
        logging: (msm, timing) => console.log(blue(`[sequelize]`), gray(msm), `${blue(bold(`${timing}ms`))}`)
      });

      instance.addModels([CatsSchema]);

      await instance.sync();

      this.logger.log(`🎯 ${dialect} connected successfully!\n`);
      this.sequelize = instance;
      return this.sequelize;
    } catch (error) {
      this.logger.fatal(error);
    }
  }

  getDatabase<TInstance = Sequelize>(): TInstance {
    return this.sequelize as TInstance;
  }
}
