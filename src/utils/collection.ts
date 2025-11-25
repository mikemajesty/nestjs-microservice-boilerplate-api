import { ApiInternalServerException } from './exception';
import { SortEnum } from './sort';

export class CollectionUtil {
  static groupBy<T>(collection: T[], property: keyof T): Record<string, T[]> {
    if (collection.length === 0) {
      return {};
    }

    return collection.reduce(
      (accumulator, currentItem) => {
        const key = String(currentItem[property]);
        if (!accumulator[key]) {
          accumulator[key] = [];
        }
        accumulator[key].push(currentItem);
        return accumulator;
      },
      {} as Record<string, T[]>
    );
  }

  static maxBy<T>(collection: T[] = [], key: keyof T): T | null {
    if (collection.length === 0) {
      return null;
    }

    if (!key) {
      throw new ApiInternalServerException('key is required');
    }

    return collection.reduce((prev, current) => {
      const prevValue = prev[key];
      const currentValue = current[key];

      if (typeof prevValue !== 'number' || typeof currentValue !== 'number') {
        throw new ApiInternalServerException('Values must be numbers for comparison');
      }

      return prevValue > currentValue ? prev : current;
    }, collection[0]);
  }

  static max(collection: (string | number)[]): number {
    if (collection.length === 0) {
      return NaN;
    }
    return Math.max(...collection.map((c) => Number(c)));
  }

  static minBy<T>(collection: T[], key: keyof T): T | null {
    if (collection.length === 0) {
      return null;
    }

    return collection.reduce((prev, current) => {
      const prevValue = prev[key];
      const currentValue = current[key];

      if (typeof prevValue !== 'number' || typeof currentValue !== 'number') {
        throw new ApiInternalServerException('Values must be numbers for comparison');
      }

      return prevValue < currentValue ? prev : current;
    }, collection[0]) as T;
  }

  static min(collection: (string | number)[]): number {
    if (collection.length === 0) {
      return NaN;
    }
    return Math.min(...collection.map((c) => Number(c)));
  }

  static sum(collection: (string | number)[] = []): number {
    if (!collection.length) {
      return 0;
    }
    return collection.reduce((sum, current) => {
      return Number(sum) + Number(current);
    }, 0) as number;
  }

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

  static hasDuplicated(collection: unknown[] = []): boolean {
    return new Set(collection).size !== collection.length;
  }

  static chunk<T>(list: T[], size: number): T[][] {
    if (size <= 0) {
      throw new Error('Size must be greater than 0');
    }

    const array: T[][] = [];
    for (let i = 0; i < list.length; i += size) {
      const chunk = list.slice(i, i + size);
      array.push(chunk);
    }
    return array;
  }

  static sortNullToLastPosition<T>(collection: T[], key: keyof T, sort: SortEnum = SortEnum.asc): T[] {
    return [...collection].sort((a: T, b: T) => {
      const aValue = a[key] ?? null;
      const bValue = b[key] ?? null;

      if (aValue === bValue) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      if (sort === SortEnum.asc) {
        return aValue < bValue ? -1 : 1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }
}
