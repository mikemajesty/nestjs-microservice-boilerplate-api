# WithErrorContext

`WithErrorContext` adds the declaring class and method to errors thrown by an
async method. By default, it preserves the original error when possible and
wraps non-extensible values with `ApiInternalServerException`.

```ts
class UserRepository {
  @WithErrorContext()
  async findById(id: string) {
    return this.repository.findOneByOrFail({ id })
  }
}
```

The resulting context is `UserRepository.findById`. Existing error contexts
are preserved.

## Mapping errors

Pass an optional `map` function when a method needs to translate an error type.
The decorator calls it once with the caught value, then applies the existing
context to the mapped error unless that error already has its own context.

```ts
class UserRepository {
  @WithErrorContext({
    map: (error) =>
      new ApiDatabaseException(error instanceof Error ? error.message : String(error), {
        cause: error
      })
  })
  async findById(id: string) {
    return this.repository.findOneByOrFail({ id })
  }
}
```

The mapper is responsible for preserving the original cause when it creates a
new exception. If it returns a primitive or an error that cannot receive a
context, the decorator wraps it in `ApiInternalServerException`.
