import { z } from 'zod';

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

export const SortSchema = z.object({
  sort: z.record(z.string().trim().min(1), z.nativeEnum(SortEnum))
});

export type SortInput = z.infer<typeof SortSchema>;
