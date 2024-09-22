import { Connection } from 'mongoose';

const skipParentheses = (filter: string) => {
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

export const diacriticSensitiveRegex = (text = ''): string => {
  return text
    .replace(/a/g, '[a,á,à,ä,â,ã]')
    .replace(/e/g, '[e,é,ë,è,ê]')
    .replace(/i/g, '[i,í,ï,ì,î]')
    .replace(/o/g, '[o,ó,ö,ò,ô]')
    .replace(/c/g, '[c,ç]')
    .replace(/u/g, '[u,ü,ú,ù]');
};

export const createMongoRegexText = (text = ''): string => {
  return diacriticSensitiveRegex(skipParentheses(text));
};
