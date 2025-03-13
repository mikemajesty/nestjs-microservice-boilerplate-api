import { SearchInput } from './search';
import { SortInput } from './sort';
import { Infer, InputValidator } from './validator';

const maxLimit = (limit: number) => (limit > 100 ? 100 : limit);

export const PaginationSchema = InputValidator.object({
  page: InputValidator.number().or(InputValidator.string()).or(InputValidator.nan()).default(1),
  limit: InputValidator.number().or(InputValidator.string()).or(InputValidator.nan()).default(10)
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
      page: page > 0 ? page : 1,
      limit: limit > 0 ? maxLimit(limit) : 10
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

export class PaginationUtils {
  static calculateSkip = (input: Infer<typeof PaginationSchema>) => {
    return (input.page - 1) * input.limit;
  };

  static calculateTotalPages = ({ limit, total }: { limit: number; total: number }) => {
    return Number(Math.ceil(total / limit));
  };
}

export type PaginationInput<T> = Infer<typeof PaginationSchema> & SortInput & SearchInput<Partial<T>>;
export type PaginationOutput<T> = Infer<typeof PaginationSchema> & { total: number; docs: T[]; totalPages?: number };
