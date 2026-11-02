/** Converts between byte counts and 1024-based KB, MB, and GB units. */
export class ByteSize {
  private static readonly BYTES_PER_KILOBYTE = 1024

  /** @param value The value in kilobytes to convert to bytes. */
  static fromKilobytes(value: number): number {
    return value * this.BYTES_PER_KILOBYTE
  }

  /** @param value The value in megabytes to convert to bytes. */
  static fromMegabytes(value: number): number {
    return this.fromKilobytes(value * this.BYTES_PER_KILOBYTE)
  }

  /** @param value The value in gigabytes to convert to bytes. */
  static fromGigabytes(value: number): number {
    return this.fromMegabytes(value * this.BYTES_PER_KILOBYTE)
  }

  /** @param bytes The value in bytes to convert to kilobytes. */
  static toKilobytes(bytes: number): number {
    return bytes / this.BYTES_PER_KILOBYTE
  }

  /** @param bytes The value in bytes to convert to megabytes. */
  static toMegabytes(bytes: number): number {
    return this.toKilobytes(bytes) / this.BYTES_PER_KILOBYTE
  }

  /** @param bytes The value in bytes to convert to gigabytes. */
  static toGigabytes(bytes: number): number {
    return this.toMegabytes(bytes) / this.BYTES_PER_KILOBYTE
  }
}
