import { randomBytes } from 'node:crypto'

import bcrypt from 'bcrypt'

export class PasswordUtils {
  /**
   * Decoy hash: exists only to be compared against, never stored or matched.
   * Built on first use from random bytes with the current SALT_ROUNDS, so its cost
   * always equals the cost of real password hashes.
   */
  private static decoyHash: Promise<string> | undefined

  private static readonly SALT_ROUNDS = 12

  static async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.SALT_ROUNDS)
  }

  static async compare(plain: string, storedHash?: string): Promise<boolean> {
    if (!storedHash) {
      await bcrypt.compare(plain, await this.getDecoyHash())
      return false
    }

    return bcrypt.compare(plain, storedHash)
  }

  private static getDecoyHash(): Promise<string> {
    this.decoyHash ??= this.hash(randomBytes(32).toString('hex'))
    return this.decoyHash
  }

  static isHash(value: string): boolean {
    try {
      bcrypt.getRounds(value)
      return true
    } catch {
      return false
    }
  }
}
