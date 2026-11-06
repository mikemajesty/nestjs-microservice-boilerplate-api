# Distributed Lock

`DistributedLockModule` exposes `IDistributedLockAdapter` for coordinating work
across application instances with Redis.

## Acquire and release

`tryAcquireLock` returns `null` when the lock is already held. On success, it
returns a decimal-string fencing token and a release function:

```ts
const lock = await this.distributedLock.tryAcquireLock({
  key: `invoice:${invoiceId}`,
  ttlSeconds: 30
})

if (!lock) {
  return
}

try {
  await this.invoiceService.process(invoiceId, lock.fencingToken)
} finally {
  await lock.release()
}
```

Always release in a `finally` block. Release is conditional on the owner token,
so an expired lock that has since been acquired by another process is not
deleted by the previous owner.

## Fencing tokens

Every successful acquisition receives a monotonically increasing token for
that lock key. Tokens are decimal strings because Redis counters are signed
64-bit integers and JavaScript numbers cannot represent every 64-bit integer
exactly.

A fencing token only protects the resource if the consumer passes it to that
resource and the resource atomically rejects writes with a token older than the
highest token it has accepted. For example, a database update can compare the
incoming token with a stored fencing-token column and update that column in the
same statement or transaction as the protected data. The resource-specific
comparison is the consumer's responsibility; merely acquiring and releasing
this lock does not fence writes.

The Redis counter is persistent and must not be deleted or given a TTL. Resetting
it can cause new tokens to be lower than tokens previously accepted by the
protected resource. A counter is maintained for each distinct lock key, so use
stable, bounded key names rather than generating a new lock key for every
operation. The guarantee also depends on Redis preserving acknowledged counter
increments across restarts and failovers; deployments that can roll back Redis
writes should use a fencing-token source with stronger durability.

Lock keys and counters use the same Redis Cluster hash slot. This implementation
uses a new key format; during rollout, old and new application versions do not
coordinate on the same lock keys. Drain old versions before enabling the new
version for work protected by these locks.

## Lease expiration

The lock is a lease and expires after `ttlSeconds`. There is no automatic
renewal. If work outlives the TTL, another process can acquire the lock while
the original process is still running. Fencing protects the resource only when
that resource enforces the token on writes.
