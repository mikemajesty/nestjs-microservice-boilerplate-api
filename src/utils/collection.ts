import { ApiInternalServerException } from './exception';
import { SortEnum } from './sort';

export class CollectionUtil {
  static groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
    return (arr || []).reduce(
      (acc, item) => {
        const k = String(item[key] ?? '');
        (acc[k] ??= []).push(item);
        return acc;
      },
      {} as Record<string, T[]>
    );
  }

  static maxBy<T>(arr: T[], key: keyof T): T | null {
    if (!arr?.length) return null;

    const first = arr[0][key];
    if (typeof first !== 'number') {
      throw new ApiInternalServerException(`Property "${String(key)}" must be numeric`);
    }

    return arr.reduce((a, b) => (a[key] > b[key] ? a : b));
  }

  static minBy<T>(arr: T[], key: keyof T): T | null {
    if (!arr?.length) return null;

    const first = arr[0][key];
    if (typeof first !== 'number') {
      throw new ApiInternalServerException(`Property "${String(key)}" must be numeric`);
    }

    return arr.reduce((a, b) => (a[key] < b[key] ? a : b));
  }

  static max(arr: (number | string)[]): number {
    const nums = (arr || []).map((n) => Number(n)).filter((n) => !isNaN(n));
    return nums.length ? Math.max(...nums) : NaN;
  }

  static min(arr: (number | string)[]): number {
    const nums = (arr || []).map((n) => Number(n)).filter((n) => !isNaN(n));
    return nums.length ? Math.min(...nums) : NaN;
  }

  static sum(arr: (number | string)[]): number {
    return (arr || []).reduce((s: number, n) => s + (Number(n) || 0), 0);
  }

  static sumBy<T>(arr: T[], key: keyof T): number {
    return (arr || []).reduce((s, item) => {
      const val = item[key];
      return s + (typeof val === 'number' ? val : Number(val) || 0);
    }, 0);
  }

  static hasDuplicated<T>(arr: T[]): boolean {
    return new Set(arr || []).size !== (arr?.length || 0);
  }

  static chunk<T>(arr: T[], size: number): T[][] {
    if (size <= 0) throw new Error('Size must be > 0');
    return (arr || []).reduce((chunks, _, i) => {
      if (i % size === 0) chunks.push(arr!.slice(i, i + size));
      return chunks;
    }, [] as T[][]);
  }

  static sortNullLast<T>(arr: T[], key: keyof T, sort: SortEnum = SortEnum.asc): T[] {
    return [...(arr || [])].sort((a, b) => {
      const av = a[key] ?? null,
        bv = b[key] ?? null;
      if (av === bv) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return sort === SortEnum.asc ? (av < bv ? -1 : 1) : av < bv ? 1 : -1;
    });
  }

  static isEmpty<T>(arr: T[] | null | undefined): boolean {
    return !arr?.length;
  }
}
