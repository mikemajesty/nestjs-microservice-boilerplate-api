import { MongooseModuleOptions } from '@nestjs/mongoose';

import { IDataBaseAdapter } from '../adapter';
import { ConnectionType } from '../types';

export class MongoService implements Partial<IDataBaseAdapter> {
  getConnection<TOpt = MongooseModuleOptions>({ URI }: ConnectionType): TOpt {
    return {
      uri: URI
    } as TOpt;
  }
}
