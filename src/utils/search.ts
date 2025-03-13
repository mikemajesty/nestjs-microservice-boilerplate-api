import { Infer, InputValidator } from './validator';

export type SearchInput<T> = { search: T | null };

export const SearchHttpSchema = InputValidator.string()
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

export type SearchHttpSchemaInput = Infer<typeof SearchHttpSchema>;

export const SearchSchema = InputValidator.object({
  search: InputValidator.record(
    InputValidator.string().trim(),
    InputValidator.number().or(InputValidator.string()).or(InputValidator.array(InputValidator.any()))
  )
    .nullable()
    .default({})
});
