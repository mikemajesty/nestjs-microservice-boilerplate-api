# Public Decorator

`@Public()` marks a controller or route as public for authentication
purposes. The `AuthenticationGuard` reads this metadata and skips the
requirement for an access token.

```typescript
@Controller()
@Public()
export class LoginController {
  @Post('refresh')
  @Public()
  async refresh() {
    // The route does not require an access token.
  }
}
```

The decorator can be applied at controller or handler level. Handler metadata
takes precedence over controller metadata. Public means authentication is not
required; when an authorization header is supplied, the guard still validates
the token and checks its blacklist status.

`@Public()` does not grant authorization or bypass other guards such as
`AuthorizationGuard` when a route also declares `@Permission(...)`.

Implementation: [`public.decorator.ts`](../../src/utils/decorators/public.decorator.ts)
and [`authentication.guard.ts`](../../src/middlewares/guards/authentication.guard.ts).
See [Middlewares](../middlewares/README.md) for guard documentation and
[Permission](./permission.md) for permission metadata.
