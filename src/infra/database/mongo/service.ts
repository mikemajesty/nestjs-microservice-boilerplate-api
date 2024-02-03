import { MongooseModuleOptions } from '@nestjs/mongoose';
import mongoose from 'mongoose';

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

  async isConnected(): Promise<boolean> {
    return new Promise((res) => {
      mongoose.connection
        .on('connected', () => {
          res(true);
        })
        .on('disconnected', () => Promise.resolve(false));
    });
  }
}
