import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { name } from '../../../../package.json';
import { IDataBaseAdapter } from '../adapter';
import { ConnectionType } from '../types';

export class PostgresService implements Partial<IDataBaseAdapter> {
  getConnection<TOpt = TypeOrmModuleOptions & { url: string }>({ URI }: ConnectionType): TOpt {
    return {
      type: 'postgres',
      url: URI,
      database: name
    } as TOpt;
  }
}
