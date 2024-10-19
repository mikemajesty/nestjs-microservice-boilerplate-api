import crypto from 'crypto';

export class CryptoUtils {
  static createHash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}
