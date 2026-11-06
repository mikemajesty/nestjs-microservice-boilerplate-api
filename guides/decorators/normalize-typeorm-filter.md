# NormalizeTypeOrmFilter Decorator

Adds an explicit `deletedAt IS NULL` condition to TypeORM filters, including each condition in an OR array. It accepts an optional argument index for methods where the filter is not the first parameter.

```typescript
@NormalizeTypeOrmFilter()
async find(filter: Partial<UserEntity>) {
  return this.repository.find({ where: filter })
}

@NormalizeTypeOrmFilter(1)
async findWithFields(fields: string[], filter?: Partial<UserEntity>) {
  return this.repository.find({ select: fields, where: filter })
}
```

The decorator creates a new filter object and does not mutate the caller's input. It is intended for methods whose annotated argument is a TypeORM `where` filter, not for arbitrary options or command lists.
