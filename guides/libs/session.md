# Session

Login sessions on top of the [Token](./token.md) lib. It issues the access/refresh token pair,
rotates refresh tokens, and ends sessions on logout, password change and password reset.

📄 Code: [`src/libs/session/`](../../src/libs/session/)

---

## Why sessions instead of a blacklist

A blacklist of access tokens has two gaps:

- The refresh token keeps working, so a "logged out" client can call `/refresh` and get a new access token.
- A per-user blacklist key also blocks the tokens of the next login.

A session solves both: every token carries the id of the session it belongs to, and the session
lives in Redis. Ending the session invalidates its access **and** refresh tokens at once, while a new
login opens a new session that is not affected.

---

## Storage

One Redis key per login session:

```
auth:session:<userId>:<sessionId> = <id of the current refresh token>     TTL = REFRESH_TOKEN_EXPIRATION
```

Redis expires each session on its own when its refresh token would expire.

## Tokens

| Token   | Secret                   | Lifetime                   | Payload                          |
|---------|--------------------------|----------------------------|----------------------------------|
| Access  | `JWT_SECRET_KEY`         | `TOKEN_EXPIRATION`         | `id`, `email`, `name`, `sid`     |
| Refresh | `JWT_REFRESH_SECRET_KEY` | `REFRESH_TOKEN_EXPIRATION` | `userId`, `sid`, `jti`           |

Both are HS256; `TokenService` pins the algorithm on sign and verify. Different secrets mean an
access token is rejected by `/refresh`, and a refresh token is rejected by the guard.

---

## API

| Method | Used by | What it does |
|--------|---------|--------------|
| `start(user)` | `LoginUsecase` | New `sid` and `jti`, stores the session, returns the token pair |
| `rotate(refreshToken, loadUser)` | `RefreshTokenUsecase` | Validates the refresh token, swaps its `jti` for a new one, returns a new pair |
| `isActive(userId, sid)` | `AuthenticationGuard` | `EXISTS` on the session key |
| `revoke(userId, sid)` | `LogoutUsecase` | Ends one session (this device only) |
| `revokeAll(userId)` | Change password, reset password | Ends every session of the user (`SCAN` + `DEL`) |

### Rotation and reuse detection

Each refresh token works **once**. `rotate` runs a small Lua script so the check and the swap are atomic:

```
stored jti == presented jti  → store the new jti, return new tokens
stored jti != presented jti  → delete the session (an old refresh token was replayed: likely stolen)
no session                   → 401 (expired, logged out, or revoked)
```

Two concurrent refreshes with the same token: one succeeds, the other gets 401.
Clients must always replace the stored refresh token with the one returned by `/refresh`.

`loadUser` runs after the swap. If it throws (user deleted, no roles), the client never receives the
new refresh token, so the session cannot be used again.

---

## Flows

```
POST /login          → start()       → { accessToken, refreshToken }
any protected route  → guard: verify JWT + isActive(id, sid)       → 401 if the session ended
POST /refresh        → rotate()      → new pair; the old refresh token stops working
POST /logout         → revoke()      → 204; this session's tokens stop working, other devices keep theirs
change/reset password → revokeAll()  → every device must log in again
```

---

## Trade-offs

- **`revokeAll` uses `SCAN`.** It walks the keyspace in batches without blocking Redis. It only runs on
  password change/reset. If that ever weighs, switch to a per-user `revoked-before` timestamp.
- **Sliding sessions.** Each refresh restarts the refresh lifetime, so an active client stays logged in.
  Add an absolute maximum (e.g. a `startedAt` claim) if you need forced re-login after N days.
- **Race on password change.** A login that validated the old password milliseconds before the change can
  store its session after `revokeAll` runs. The window is tiny and exists in any store-based design.

## Testing

- Unit tests mock `ISessionAdapter`.
- E2E specs that mock `ITokenAdapter` also override `ISessionAdapter` with `TestEnd2EndUtils.sessionMock()`
  and put `sid: TestEnd2EndUtils.SESSION_ID` in the mocked user.
- [`__tests__/integration.spec.ts`](../../src/libs/session/__tests__/integration.spec.ts) runs the service
  against a real Redis (Testcontainers): TTL, concurrent rotation and `revokeAll`.
