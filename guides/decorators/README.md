# Decorators

Decorator guides are kept directly in this folder. The table maps each
decorator's source file to its documentation; source subfolders are reflected
in the paths, but the Markdown files are not nested.

| Source file | Exported decorator | Guide |
| --- | --- | --- |
| `src/utils/decorators/public.decorator.ts` | `Public` | [public.md](./public.md) |
| `src/utils/decorators/request-timeout.decorator.ts` | `RequestTimeout` | [request-timeout.md](./request-timeout.md) |
| `src/utils/decorators/role.decorator.ts` | `Permission` | [permission.md](./permission.md) |
| `src/utils/decorators/validate-schema.decorator.ts` | `ValidateSchema` | [validate-schema.md](./validate-schema.md) |
| `src/utils/decorators/with-error-context.decorator.ts` | `WithErrorContext` | [with-error-context.md](./with-error-context.md) |
| `src/utils/decorators/filter/mongoose/normalize-mongo-filter.decorator.ts` | `NormalizeMongoFilter` | [normalize-mongo-filter.md](./normalize-mongo-filter.md) |
| `src/utils/decorators/filter/mongoose/transform-mongoose-search.decorator.ts` | `TransformMongooseSearch` | [transform-mongoose-search.md](./transform-mongoose-search.md) |
| `src/utils/decorators/filter/typeorm/normalize-typeorm-filter.decorator.ts` | `NormalizeTypeOrmFilter` | [normalize-typeorm-filter.md](./normalize-typeorm-filter.md) |
| `src/utils/decorators/filter/typeorm/transform-type-orm-search.decorator.ts` | `TransformTypeOrmSearch` | [transform-type-orm-search.md](./transform-type-orm-search.md) |
| `src/utils/decorators/sort/transform-sort.decorator.ts` | `TransformSort` | [transform-sort.md](./transform-sort.md) |

`AllowedFilter`, `SearchTypeEnum`, and other shared decorator types are
declared in `src/utils/decorators/types.ts`; exports are collected by
`src/utils/decorators/index.ts`.
