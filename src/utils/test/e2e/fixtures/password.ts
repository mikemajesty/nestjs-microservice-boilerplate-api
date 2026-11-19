/**
 * Precomputed bcrypt hashes for tests, paired with their plain-text password.
 * Cost 4 (bcrypt's minimum) keeps tests fast; production uses PasswordUtils (cost 12).
 * Regenerate with: node -e "console.log(require('bcrypt').hashSync('<plain>', 4))"
 */
export class PasswordFixture {
  /** Default password of the e2e admin user (UserFixture). */
  static readonly ADMIN = {
    plain: 'admin',
    hash: '$2b$04$0SYB7ktxDaVNPHCpiWWljeZYtWUSXAmFh/jx/A4mXkYMT/ydV7.GS'
  } as const

  /** Masked password used as input across unit tests. */
  static readonly MASKED = {
    plain: '****',
    hash: '$2b$04$BS4nRy4ftmWMdao47a6TBuxDwvBzHrxlHSwG.BXGZrT9kNMoHMJFW'
  } as const
}
