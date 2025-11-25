import { z } from 'zod';

import { Infer, InputValidator } from './validator';

export enum SortEnum {
  asc = 1,
  desc = -1
}

export const SortHttpSchema = z
  .string()
  .optional()
  .refine(
    (check) => {
      if (!check) return true;
      return [!check.startsWith(':'), check.includes(':')].every(Boolean);
    },
    {
      message: 'invalidSortFormat'
    }
  )
  .refine(
    (sort) => {
      if (!sort) return true;

      return String(sort)
        .split(',')
        .every((s) => {
          const [order] = s.split(':').reverse();
          return ['asc', 'desc'].includes(order.trim().toLowerCase() || 'asc');
        });
    },
    {
      message: 'invalidSortOrderMustBe: asc, desc'
    }
  )
  .transform((sort) => {
    const sortDefault = sort || 'createdAt:desc';

    const order = Object.fromEntries(
      String(sort && !sort.includes('createdAt') ? sort : sortDefault)
        .split(',')
        .map((s) => {
          const [field, order] = s.split(':');
          const sorted = [field.trim(), SortEnum[(order.trim().toLowerCase() || 'asc') as keyof typeof SortEnum]];
          return sorted;
        })
    );

    return order;
  });

export const SortSchema = InputValidator.object({
  sort: InputValidator.record(InputValidator.string().trim().min(1), InputValidator.enum(SortEnum))
    .nullable()
    .default({})
});

export type SortInput = Infer<typeof SortSchema>;
