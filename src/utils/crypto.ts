/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/crypto.md
 */
import crypto from 'crypto'

export class CryptoUtils {
  static createHash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex')
  }

  static generateRandomBase64(): string {
    return crypto.randomBytes(16).toString('base64')
  }
}
