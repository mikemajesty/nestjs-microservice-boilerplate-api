import { Connection, Types } from 'mongoose';

export class MongoUtils {
  static createObjectId = (id?: string): Types.ObjectId => {
    return new Types.ObjectId(id);
  };

  static isObjectId = (id?: string) => {
    if (id) {
      return Types.ObjectId.isValid(id);
    }
    return false;
  };

  static skipParentheses = (filter: string | string[]): string | string[] => {
    if (typeof filter === 'string') {
      return filter?.replace('(', '\\(')?.replace(')', '\\)');
    }
    if (typeof filter === 'object') {
      return filter.map((f) => f.replace('(', '\\(')?.replace(')', '\\)'));
    }

    return filter;
  };

  static calculateMongoSkip = (page: number, limit: number): number => {
    return ((page || 1) - 1) * Number(limit || 10);
  };

  static diacriticSensitiveRegex = (filter: string | string[]): string | string[] => {
    if (typeof filter === 'string') {
      return filter
        .replace(/a/g, '[a,á,à,ä,â,ã]')
        .replace(/e/g, '[e,é,ë,è,ê]')
        .replace(/i/g, '[i,í,ï,ì,î]')
        .replace(/o/g, '[o,ó,ö,ò,ô]')
        .replace(/c/g, '[c,ç]')
        .replace(/u/g, '[u,ü,ú,ù]');
    }
    if (typeof filter === 'object') {
      const regexText = filter.map((f) => {
        return f
          .replace(/a/g, '[a,á,à,ä,â,ã]')
          .replace(/e/g, '[e,é,ë,è,ê]')
          .replace(/i/g, '[i,í,ï,ì,î]')
          .replace(/o/g, '[o,ó,ö,ò,ô]')
          .replace(/c/g, '[c,ç]')
          .replace(/u/g, '[u,ü,ú,ù]');
      });
      return regexText;
    }

    return filter;
  };

  static createMongoRegexText = (text: string | string[]): string | string[] => {
    return this.diacriticSensitiveRegex(this.skipParentheses(text));
  };
}

export type MongoRepositoryModelSessionType<T> = T & { connection?: Connection };

export type MongoRepositorySession = {
  abortTransaction: () => Promise<{ [key: string]: unknown }>;
  commitTransaction: () => Promise<{ [key: string]: unknown }>;
};
