# RequestTimeoutInterceptor

The global interceptor applies the effective request deadline to the Nest handler
chain and raises `ApiTimeoutException` (`408`) when that deadline expires.

## How the effective deadline is chosen

1. `@RequestTimeout(ms)` sets the local route limit when present.
2. Otherwise, `HTTP_REQUEST_TIMEOUT_MS` is the local limit.
3. An earlier inbound `X-Request-Deadline` takes precedence by shortening that limit.
   The header can never extend the receiving service's local maximum.

`X-Request-Deadline` is an absolute Unix timestamp in milliseconds. Malformed values
return `400`; deadlines already expired return `408`. Since clients can send this
header, treat it as untrusted input and keep service clocks synchronized.

The interceptor runs after guards, so its RxJS timeout does not cancel work performed
by guards. The deadline is available to downstream calls made within the handler chain.
See [Deadline](../utils/deadline.md) for outbound propagation and dependency behavior.

## Related

- [@RequestTimeout Decorator](../decorators/request-timeout.md) — route-level timeout limit
- [Deadline](../utils/deadline.md) — deadline propagation and consumption
- [ApiTimeoutException](../utils/exception.md) — HTTP 408 exception
