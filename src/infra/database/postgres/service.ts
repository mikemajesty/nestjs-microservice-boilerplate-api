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
  constructor(private readonly secret: ISecretsAdapter, private readonly logger: ILoggerAdapter) {}

  getConnection<TOpt = unknown & { url: string }>({ URI }: ConnectionType): TOpt {
    return {
      type: 'postgres',
      url: URI,
      database: name
    } as TOpt;
  }

  async connect(): Promise<Sequelize> {
    try {
      const instance = new Sequelize(this.secret.POSTGRES_URL, {
        dialect: 'postgres',
        benchmark: true,
        // eslint-disable-next-line no-console
        logging: (msm, timing) => console.log(blue(`[sequelize]`), gray(msm), `${blue(bold(`${timing}ms`))}`)
      });

      await instance.sync();

      instance.addModels([CatsSchema]);

      this.logger.log('Sequelize connected!');
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
