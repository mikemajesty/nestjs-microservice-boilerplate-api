import { ConnectionType } from './types';

export abstract class IDataBaseAdapter {
  abstract getConnection<TConnection>(model: ConnectionType): TConnection;
}
