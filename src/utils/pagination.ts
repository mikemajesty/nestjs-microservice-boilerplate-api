import { z } from 'zod';

import { SearchInput } from './search';
import { SortInput } from './sort';

const maxLimit = (limit: number) => (limit > 100 ? 100 : limit);

export const PaginationSchema = z
  .object({
    page: z.number().or(z.string()).or(z.nan()).default(1),
    limit: z.number().or(z.string()).or(z.nan()).default(10)
  })
  .transform((pagination) => {
    let limit = Number(pagination.limit);
    let page = Number(pagination.page);

    if (isNaN(limit)) {
      limit = 10;
    }

    if (isNaN(page)) {
      page = 1;
    }

    return {
      page: page > 0 ? +page : 1,
      limit: limit > 0 ? maxLimit(+limit) : 10
    };
  })
  .refine((pagination) => Number.isInteger(pagination.page), {
    path: ['page'],
    message: 'invalidInteger'
  })
  .refine((pagination) => Number.isInteger(pagination.limit), {
    path: ['limit'],
    message: 'invalidInteger'
  });

export type PaginationInput<T> = z.infer<typeof PaginationSchema> & SortInput & SearchInput<Partial<T>>;
export type PaginationOutput<T> = z.infer<typeof PaginationSchema> & { total: number; docs: T[] };

export const calculateSkip = (input: z.infer<typeof PaginationSchema>) => {
  return (input.page - 1) * input.limit;
};
