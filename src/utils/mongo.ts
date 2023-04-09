import { ClientSession, Connection } from 'mongoose';

export const skipParentheses = (filter: string) => {
  return filter?.replace('(', '\\(')?.replace(')', '\\)');
};

export type MongoRepositoryModelSessionType<T> = T & { connection?: Connection };

export type MongoRepositorySession = ClientSession;
