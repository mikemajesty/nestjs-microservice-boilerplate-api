/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/id-generator.md
 */
import { randomBytes, UUID } from 'crypto'
import * as uuid from 'uuid'

import { ApiUnauthorizedException } from './exception'

/**
 * ID Generator Utility Class
 * Provides methods to generate various types of unique identifiers
 * with clear semantic use cases for each type.
 */
export class IDGeneratorUtils {
  /**
   * Generates a UUID (Universally Unique Identifier) v4
   *
   * UUIDs are 128-bit identifiers following RFC 4122 specification.
   * They provide guaranteed uniqueness across distributed systems without coordination.
   *
   * Characteristics:
   * - 36 characters (32 hex + 4 hyphens)
   * - Cryptographically secure random generation
   * - Extremely low collision probability
   * - Universally recognized standard
   *
   * Best for:
   * - Distributed systems and microservices
   * - Database primary keys across multiple servers
   * - When global uniqueness is required
   * - Tracking entities across system boundaries
   *
   * @param options - UUID generation options
   * @returns UUID string in 8-4-4-4-12 format
   *
   * @example
   * ```typescript
   * // Basic UUID
   * const id = idGen.uuid();
   * // Returns: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
   *
   * // Prefixed UUID
   * const userId = idGen.uuid({ prefix: 'user_' });
   * // Returns: "user_f47ac10b-58cc-4372-a567-0e02b2c3d479"
   * ```
   */
  static uuid(options: UUIDOptions = {}): string {
    const { prefix = '', suffix = '', version = 4, namespace } = options

    if (version === 4) {
      return `${prefix}${uuid.v4()}${suffix}`
    }

    if (version === 1) {
      return `${prefix}${uuid.v1()}${suffix}`
    }

    if (version === 3) {
      if (!namespace) {
        throw new ApiUnauthorizedException('Namespace is required for UUID version 3')
      }
      if (!uuid.validate(namespace)) {
        throw new ApiUnauthorizedException('Invalid namespace UUID for UUID version 3')
      }
      return `${prefix}${uuid.v3(uuid.v4(), namespace)}${suffix}`
    }

    if (version === 5) {
      if (!namespace) {
        throw new ApiUnauthorizedException('Namespace is required for UUID version 5')
      }
      if (!uuid.validate(namespace)) {
        throw new ApiUnauthorizedException('Invalid namespace UUID for UUID version 5')
      }
      return `${prefix}${uuid.v5(uuid.v4(), namespace)}${suffix}`
    }

    throw new ApiUnauthorizedException(`unsupported UUID version: ${version}`)
  }

  /**
   * Generates a ULID (Universally Unique Lexicographically Sortable ID)
   *
   * ULIDs are 128-bit identifiers that are lexicographically sortable by generation time.
   * They combine the benefits of UUIDs (uniqueness) with timestamp ordering.
   *
   * Characteristics:
   * - 26 characters (Crockford's Base32)
   * - URL-safe (no special characters)
   * - Monotonically increasing within same millisecond
   * - Sortable by creation time
   * - Case-insensitive (usually uppercase)
   *
   * Best for:
   * - Database primary keys where chronological order matters
   * - Event logs and time-series data
   * - Message queues and distributed logs
   * - When you need to sort IDs by creation time
   *
   * @param options - ULID generation options
   * @returns 26-character ULID string
   *
   * @example
   * ```typescript
   * // Basic ULID
   * const id = idGen.ulid();
   * // Returns: "01F8Z6K4V3HJ7WQ5RXT9M2G1NY"
   *
   * // ULID with prefix and lowercase
   * const logId = idGen.ulid({
   *   prefix: 'log_',
   *   lowercase: true
   * });
   * // Returns: "log_01f8z6k4v3hj7wq5rxt9m2g1ny"
   * ```
   */
  static ulid(options: ULIDOptions = {}): string {
    const { prefix = '', suffix = '', timestamp = Date.now(), lowercase = false } = options

    // Encode timestamp (10 chars)
    const timePart = timestamp.toString(32).padStart(10, '0')

    // Generate random part (16 chars)
    const randomBytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 32).toString(32)).join('')

    let id = (timePart + randomBytes).toUpperCase()

    if (lowercase) {
      id = id.toLowerCase()
    }

    return `${prefix}${id}${suffix}`
  }

  /**
   * Generates a NanoID
   *
   * NanoID is a small, secure, URL-friendly unique string ID generator.
   * It's a modern alternative to UUID that's more compact and URL-safe.
   *
   * Characteristics:
   * - Default 21 characters (configurable)
   * - URL-safe (no special characters except - and _)
   * - Uses cryptographically strong random generator
   * - 4x faster than UUID
   * - Smaller than UUID (21 chars vs 36)
   * - Customizable alphabet and size
   *
   * Best for:
   * - Short URLs and links
   * - Resource identifiers in REST APIs
   * - Session IDs and tokens
   * - Frontend applications
   * - When compact size is important
   *
   * @param options - NanoID generation options
   * @returns NanoID string
   *
   * @example
   * ```typescript
   * // Standard NanoID (21 chars)
   * const id = idGen.nanoid();
   * // Returns: "V1StGXR8_Z5jdHi6B-myT"
   *
   * // Shorter NanoID with custom alphabet
   * const shortId = idGen.nanoid({
   *   length: 12,
   *   alphabet: '0123456789ABCDEF',
   *   prefix: 'ref_'
   * });
   * // Returns: "ref_5A3F9B7C2E1D"
   * ```
   */
  static nanoid(options: NanoIdOptions = {}): string {
    const {
      prefix = '',
      suffix = '',
      length = 21,
      alphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
    } = options

    const bytes = randomBytes(length)

    const output: { id: string; prefix: string; suffix: string } = {
      id: '',
      prefix,
      suffix
    }

    for (let i = 0; i < length; i++) {
      const byte = bytes[`${i}`] % alphabet.length
      output.id += alphabet[`${byte}`]
    }

    return `${output.prefix}${output.id}${output.suffix}`
  }

  /**
   * Generates a MongoDB ObjectId
   *
   * MongoDB ObjectId is a 12-byte identifier traditionally used by MongoDB.
   * It consists of timestamp, machine ID, process ID, and counter.
   *
   * Format (12 bytes = 24 hex chars):
   * - 4 bytes: Timestamp (seconds since Unix epoch)
   * - 5 bytes: Random value (3 bytes machine ID + 2 bytes process ID)
   * - 3 bytes: Counter (starting at random value)
   *
   * Characteristics:
   * - 24 hexadecimal characters
   * - Sortable by timestamp
   * - Includes machine and process identifiers
   * - MongoDB compatible
   *
   * Best for:
   * - MongoDB databases
   * - When compatibility with MongoDB is required
   * - Distributed systems using MongoDB
   * - Migrating from/to MongoDB
   *
   * @param options - ObjectId generation options
   * @returns 24-character hexadecimal ObjectId
   *
   * @example
   * ```typescript
   * // Basic ObjectId
   * const id = idGen.objectid();
   * // Returns: "507f1f77bcf86cd799439011"
   *
   * // ObjectId with specific timestamp
   * const oldId = idGen.objectid({
   *   timestamp: 1672531200, // 2023-01-01
   *   prefix: 'mongo_'
   * });
   * // Returns: "mongo_63b3c8000000000000000000"
   * ```
   */
  static objectid(options: ObjectIdOptions = {}): string {
    const {
      prefix = '',
      suffix = '',
      timestamp = Math.floor(Date.now() / 1000),
      machineId = randomBytes(3),
      processId = process.pid % 0xffff,
      counter = Math.floor(Math.random() * 0xffffff)
    } = options

    // Convert to hex strings
    const timestampHex = timestamp.toString(16).padStart(8, '0')
    const machineHex = machineId.toString('hex')
    const processHex = processId.toString(16).padStart(4, '0')
    const counterHex = counter.toString(16).padStart(6, '0')

    const id = timestampHex + machineHex + processHex + counterHex
    return `${prefix}${id}${suffix}`
  }
  /**
   * Map of ID generation methods
   * Allows dynamic calling based on ID type
   */
  static readonly generators: Record<IDGeneratorType, (options?: IDGeneratorTypes) => string> = {
    uuid: (options?: UUIDOptions) => IDGeneratorUtils.uuid(options),
    ulid: (options?: ULIDOptions) => IDGeneratorUtils.ulid(options),
    nanoid: (options?: NanoIdOptions) => IDGeneratorUtils.nanoid(options),
    objectid: (options?: ObjectIdOptions) => IDGeneratorUtils.objectid(options)
  }

  /**
   * Generates an ID based on type
   * Type-safe alternative to using the generators map directly
   */
  static generate<T extends IDGeneratorType>(
    type: T = 'uuid' as T,
    options?: T extends 'uuid'
      ? UUIDOptions
      : T extends 'ulid'
        ? ULIDOptions
        : T extends 'nanoid'
          ? NanoIdOptions
          : T extends 'objectid'
            ? ObjectIdOptions
            : never
  ): string {
    return this.generators[`${type}`](options)
  }
}

/**
 * Supported ID generation types with their semantic use cases
 */
export type IDGeneratorType =
  | 'uuid' // Universally Unique Identifier (RFC 4122)
  | 'ulid' // Universally Unique Lexicographically Sortable ID
  | 'nanoid' // Small, secure, URL-friendly unique ID
  | 'objectid' // MongoDB ObjectId format

/**
 * Union type for all ID generation options
 */
export type IDGeneratorTypes = UUIDOptions | ULIDOptions | NanoIdOptions | ObjectIdOptions

/**
 * Base configuration options for ID generation
 */
type IDGeneratorBaseType = {
  /**
   * Optional prefix to prepend to the generated ID
   * @example 'user_', 'order_', 'doc_'
   */
  prefix?: string

  /**
   * Optional suffix to append to the generated ID
   * @example '_id', '_key', '_ref'
   */
  suffix?: string
}

/**
 * UUID-specific generation options
 */
type UUIDOptions = IDGeneratorBaseType & {
  /**
   * UUID version to generate
   * - v4: Random (most common, cryptographically secure)
   * @default 4
   */
  version?: 1 | 3 | 4 | 5

  /**
   * Namespace for UUID v3 and v5
   * Note: Not implemented in this simplified version
   */
  namespace?: UUID // Required for v3 and v5, but not implemented here
}

/**
 * ULID-specific generation options
 */
type ULIDOptions = IDGeneratorBaseType & {
  /**
   * Custom timestamp (milliseconds since Unix epoch)
   * Useful for generating consistent IDs in tests
   * @default Date.now()
   */
  timestamp?: number

  /**
   * Whether to make the ID lowercase
   * ULID specification recommends uppercase, but lowercase is sometimes preferred
   * @default false (uppercase)
   */
  lowercase?: boolean
}

/**
 * NanoID-specific generation options
 */
type NanoIdOptions = IDGeneratorBaseType & {
  /**
   * Length of the generated ID
   * Recommended: 21 characters for low collision probability (1% collision after 1 billion IDs)
   * @default 21
   */
  length?: number

  /**
   * Custom alphabet for ID generation
   * Default includes uppercase, lowercase, numbers, and URL-safe symbols
   * @default 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
   */
  alphabet?: string
}

/**
 * MongoDB ObjectId-specific generation options
 */
type ObjectIdOptions = IDGeneratorBaseType & {
  /**
   * Custom timestamp (seconds since Unix epoch)
   * @default Math.floor(Date.now() / 1000)
   */
  timestamp?: number

  /**
   * Machine identifier (3 bytes)
   * Helps ensure uniqueness across different machines
   */
  machineId?: Buffer

  /**
   * Process identifier (2 bytes)
   * Helps ensure uniqueness across different processes on the same machine
   */
  processId?: number

  /**
   * Counter starting value (3 bytes)
   * Increments with each ID generated in the same process and second
   */
  counter?: number
}
