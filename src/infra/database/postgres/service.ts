import { Sequelize } from 'sequelize-typescript';

import { ILoggerAdapter } from '@/infra/logger';

import { name } from '../../../../package.json';
import { IDataBaseAdapter } from '../adapter';
import { ConnectionType } from '../types';

export class SequelizeService implements IDataBaseAdapter {
  constructor(private readonly instance: Sequelize, private readonly logger: ILoggerAdapter) {}

  getConnection<TOpt = unknown & { url: string }>({ URI }: ConnectionType): TOpt {
    return {
      type: 'postgres',
      url: URI,
      database: name
    } as TOpt;
  }

  async connect<T extends Sequelize = Sequelize>(): Promise<T> {
    try {
      const conn = await this.instance.sync();

      this.logger.log('Sequelize connected!');
      return conn as T;
    } catch (error) {
      this.logger.fatal(error);
    }
  }

  getDatabase<TInstance = Sequelize>(): TInstance {
    return this.instance as TInstance;
  }
}
