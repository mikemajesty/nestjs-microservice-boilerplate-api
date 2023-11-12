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
    const search = {};

    String(searchString)
      .split(',')
      .forEach((s) => {
        const propertyIndex = s.indexOf(':');
        const value = s.slice(propertyIndex + 1, s.length);
        const [field] = s.split(':');
        search[`${field}`] = value.trim();
      });

    return search;
  });

export const SearchSchema = z.object({ search: z.record(z.string().trim(), z.number().or(z.string())).nullable() });
