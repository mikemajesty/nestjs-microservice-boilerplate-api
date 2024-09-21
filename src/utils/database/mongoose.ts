import { Connection } from 'mongoose';

export const skipParentheses = (filter: string) => {
  return filter?.replace('(', '\\(')?.replace(')', '\\)');
};

export type MongoRepositoryModelSessionType<T> = T & { connection?: Connection };

export type MongoRepositorySession = {
  abortTransaction: () => Promise<{ [key: string]: unknown }>;
  commitTransaction: () => Promise<{ [key: string]: unknown }>;
};

export const calculateMongoSkip = (page: number, limit: number): number => {
  return ((page || 1) - 1) * Number(limit || 10);
};

export const diacriticSensitiveRegex = (string = ''): string => {
  return string
    .replace(/a/g, '[a,á,à,ä,â]')
    .replace(/A/g, '[A,a,á,à,ä,â]')
    .replace(/e/g, '[e,é,ë,è]')
    .replace(/E/g, '[E,e,é,ë,è]')
    .replace(/i/g, '[i,í,ï,ì]')
    .replace(/I/g, '[I,i,í,ï,ì]')
    .replace(/o/g, '[o,ó,ö,ò]')
    .replace(/O/g, '[O,o,ó,ö,ò]')
    .replace(/u/g, '[u,ü,ú,ù]')
    .replace(/c/g, '[ç]')
    .replace(/c/g, '[Ç]')
    .replace(/U/g, '[U,u,ü,ú,ù]');
};
