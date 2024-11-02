/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiBadRequestException } from './exception';
import { SortEnum } from './sort';

export class CollectionUtil {
  static groupBy = <T>(collection: unknown[] = [], key: string): { [key: string]: T[] } => {
    if (!key.length) {
      throw new ApiBadRequestException();
    }

    return collection.reduce((prev: any, next: any) => {
      prev[next[key]] = prev[next[key]] ?? [];
      prev[next[key]].push(next);
      return prev;
    }, {}) as { [key: string]: [] };
  };

  static group = (collection: unknown[]) => {
    return collection.reduce((rv: any, x: any) => {
      (rv[x] = rv[x] || []).push(x);
      return rv;
    }, {});
  };

  static maxBy = (collection: unknown[] = [], key: string) => {
    if (!key.length) {
      throw new ApiBadRequestException('key is required');
    }

    return collection.reduce((prev: any, current: any) => {
      return Number(prev[key] > current[key]) ? prev : current;
    });
  };

  static max = (collection: string[] | number[]) => {
    return Math.max(...collection.map((c: number | string) => Number(c)));
  };

  static minBy = (collection: unknown[] = [], key: string) => {
    if (!key.length) {
      throw new ApiBadRequestException('key is required');
    }

    return collection.reduce((prev: any, current: any) => {
      return Number(prev[key] > current[key]) ? current : prev;
    });
  };

  static min = (collection: string[] | number[]) => {
    return Math.min(...collection.map((c: number | string) => Number(c)));
  };

  static sum = (collection: unknown[] = []) => {
    return collection.reduce((prev, current): number => {
      return Number(prev) + Number(current);
    });
  };

  static sumBy = (collection: unknown[] = [], key: string) => {
    if (!key.length) {
      throw new ApiBadRequestException('key is required');
    }

    return collection.reduce((prev: any, current: any): number => {
      if (isNaN(prev[key] || 0)) {
        return 0 + Number(current[key]);
      }

      if (prev[key]) {
        return Number(prev[key]) + Number(current[key]);
      }

      return Number(prev) + Number(current[key]);
    });
  };

  static hasDuplicated = (collection: unknown[] = []) => {
    return new Set(collection).size !== collection.length;
  };

  static chunk(list: unknown[], size: number) {
    const array = [];
    for (let i = 0; i < list.length; i += size) {
      const chunk = list.slice(i, i + size);
      array.push(chunk);
    }

    return array;
  }

  static sortNullToLastPosition = <T>(collection: T[], key: keyof T, sort: SortEnum = SortEnum.asc) => {
    return collection.sort((a: any, b: any) => {
      if (a[key.toString()] === b[key.toString()]) {
        return 0;
      }

      if (a[key.toString()] === null) {
        return 1;
      }

      if (b[key.toString()] === null) {
        return -1;
      }

      if (sort === SortEnum.asc) {
        return a[key.toString()] < b[key.toString()] ? -1 : 1;
      }

      return a[key.toString()] < b[key.toString()] ? 1 : -1;
    });
  };
}

export type LastType = {
  key: string;
  length: number | null;
};
