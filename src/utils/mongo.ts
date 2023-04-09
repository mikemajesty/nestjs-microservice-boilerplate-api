import { ClientSession, Connection } from 'mongoose';

export const skipParentheses = (filter: string) => {
  return filter?.replace('(', '\\(')?.replace(')', '\\)');
};

export type RepositoryModelSessionType<T> = T & { connection?: Connection };

export type RepositorySession = ClientSession;
