import { MongooseModuleOptions } from '@nestjs/mongoose';

import { name } from '../../../../package.json';
import { IDataBaseAdapter } from '../adapter';
import { ConnectionType } from '../types';

export class MongoService implements Partial<IDataBaseAdapter> {
  getConnection<TOpt extends MongooseModuleOptions = MongooseModuleOptions>({ URI }: ConnectionType): TOpt {
    return {
      appName: name,
      uri: URI
    } as TOpt;
  }
}
