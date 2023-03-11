import { z } from 'zod';

import { SortInput } from './sort';

const maxLimit = (limit: number) => (limit > 100 ? 100 : limit);

export const PaginationSchema = z
  .object({
    page: z.number().or(z.string()).default(1),
    limit: z.number().or(z.string()).default(10)
  })
  .transform((pagination) => {
    const limit = Number(pagination.limit);
    const page = Number(pagination.page);

    if (isNaN(limit) || isNaN(page)) {
      return { limit, page };
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

export type PaginationInput = z.infer<typeof PaginationSchema> & SortInput;
export type PaginationOutput = z.infer<typeof PaginationSchema> & { total: number };

export const calucaleSkip = (input: z.infer<typeof PaginationSchema>) => {
  return (input.page - 1) * input.limit;
};
