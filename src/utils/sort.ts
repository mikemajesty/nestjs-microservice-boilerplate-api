import { z } from 'zod';

export enum SortEnum {
  asc = 1,
  desc = -1
}

export const SortHttp = z
  .object({
    sort: z
      .string()
      .optional()
      .transform((s) => s?.toLowerCase())
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
              return ['asc', 'desc'].includes(order || 'asc');
            });
        },
        {
          message: 'invalidSortOrderMustBe: asc, desc'
        }
      )
  })
  .transform(({ sort }) => {
    const sortDefault = sort || 'createdAt:desc';

    const order = Object.fromEntries(
      String(sort ? sort?.concat(',createdAt:desc') : sortDefault)
        .split(',')
        .map((s) => {
          const [field, order] = s.split(':');
          return [field, SortEnum[(order || 'asc') as keyof typeof SortEnum]];
        })
    );

    return order;
  });

export const Sort = z.object({
  sort: z.record(z.string().trim().min(1), z.nativeEnum(SortEnum))
});

export type SortInput = z.infer<typeof Sort>;
