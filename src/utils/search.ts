import { z } from 'zod';

export type SearchInput<T> = { search?: T };

export const SearchHttpSchema = z
  .string()
  .optional()
  .refine(
    (check) => {
      if (!check) return true;
      return [!check.startsWith(':'), check.includes(':')].every(Boolean);
    },
    {
      message: 'invalidSearchFormat'
    }
  )
  .refine(
    (search) => {
      if (!search) return true;

      return String(search)
        .split(',')
        .every((s) => {
          const [value] = s.split(':').reverse();

          if (!value) return false;
          return true;
        });
    },
    {
      message: 'searchMustBe: value'
    }
  )
  .transform((searchString) => {
    if (!searchString) return null;
    const search: { [key: string]: unknown } = {};

    searchString.split(',').forEach((s) => {
      const [field, value] = s.split(':');
      const finalValue = value.split('|').map((v) => v.trim());
      if (finalValue.length > 1) {
        search[`${field}`] = value.split('|').map((v) => v.trim());
        return;
      }
      search[`${field}`] = value.trim();
    });

    return search;
  });

export const SearchSchema = z.object({
  search: z.record(z.string().trim(), z.number().or(z.string()).or(z.array(z.any()))).nullable()
});
