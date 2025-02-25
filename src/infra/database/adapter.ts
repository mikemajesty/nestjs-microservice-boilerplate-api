import { ConnectionType } from './types';

export abstract class IDataBaseAdapter {
  abstract getConnection<TConnection>(model: ConnectionType): TConnection;
  abstract getDatabase<TInstance = unknown>(): TInstance;
}
