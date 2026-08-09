/**
 * Tags attached to cached authorization data, so a single write invalidates
 * every entry that depends on it instead of relying on expiration.
 *
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/infra/cache.md
 */

/** Everything cached for one user. */
export const userCacheTag = (userId: string): string => `user:${userId}`

/** Every cached permission set, dropped when roles or permissions change. */
export const USER_PERMISSIONS_CACHE_TAG = 'user-permissions'

/** How long a permission set may survive without an explicit invalidation. */
export const USER_PERMISSIONS_CACHE_TTL_IN_SECONDS = 60
