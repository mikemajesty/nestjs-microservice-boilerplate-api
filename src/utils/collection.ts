import { SortEnum } from './sort';

export class CollectionUtil {
  static groupBy<T>(collection: T[], property: keyof T): Record<string, T[]> {
    if (collection.length === 0) {
      return {};
    }

    return collection.reduce(
      (accumulator, currentItem) => {
        const key = currentItem[property];
        if (!accumulator[`${key}`]) {
          accumulator[`${key}`] = [];
        }
        accumulator[`${key}`].push(currentItem);
        return accumulator;
      },
      {} as Record<string, T[]>
    );
  }

  static group = <T>(collection: T[]): Record<string, T[]> => {
    return collection.reduce((rv: Record<string, T[]>, x: T) => {
      const key = String(x);
      (rv[key] = rv[key] || []).push(x);
      return rv;
    }, {});
  };

  static maxBy<T>(collection: T[] = [], key: keyof T): T | null {
    if (collection.length === 0) {
      return null;
    }

    if (!key) {
      throw new Error('key is required');
    }

    return collection.reduce((prev, current) => {
      return prev[key] > current[key] ? prev : current;
    });
  }

  static max = (collection: string[] | number[]) => {
    return Math.max(...collection.map((c: number | string) => Number(c)));
  };

  static minBy = <T>(collection: T[], key: keyof T): T | null => {
    if (collection.length === 0) {
      return null;
    }

    return collection.reduce((prev, current) => {
      if (prev[key] < current[key]) {
        return prev;
      }
      return current;
    });
  };

  static min = (collection: string[] | number[]) => {
    return Math.min(...collection.map((c: number | string) => Number(c)));
  };

  static sum = (collection: unknown[] = []) => {
    if (!collection.length) {
      return 0;
    }
    return collection.reduce((prev, current): number => {
      return Number(prev) + Number(current);
    }) as number;
  };

  static sumBy<T>(collection: T[] = [], key: keyof T): number {
    if (!key) {
      throw new Error('key is required');
    }

    if (collection.length === 0) {
      return 0;
    }

    return collection.reduce((sum, current) => {
      const value = current[key];
      if (typeof value === 'number') {
        return sum + value;
      }
      return sum;
    }, 0);
  }

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

  static sortNullToLastPosition = <T>(collection: T[], key: keyof T, sort: SortEnum = SortEnum.asc): T[] => {
    return collection.sort((a: T, b: T) => {
      const aValue = a[key] ?? null;
      const bValue = b[key] ?? null;

      if (aValue === bValue) {
        return 0;
      }

      if (aValue === null) {
        return 1;
      }

      if (bValue === null) {
        return -1;
      }

      if (sort === SortEnum.asc) {
        return aValue < bValue ? -1 : 1;
      }

      return aValue < bValue ? 1 : -1;
    });
  };
}

export type LastType = {
  key: string;
  length: number | null;
};
