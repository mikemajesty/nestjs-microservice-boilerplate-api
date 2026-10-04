/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/date.md
 */
import { DateTime } from 'luxon'

import { ApiInternalServerException } from './exception'

export class DateUtils {
  private static readonly DEFAULT_DATE_FORMAT = 'yyyy-MM-dd'
  private static readonly UTC = 'utc'

  static build<T extends Date | string>(input: BuildInput): T {
    const date = this.parseDate(input?.date)
    const format = input?.format ?? this.defaultFormat
    const zone = input?.timezone ?? this.UTC

    if (!this.isValidTimezone(zone)) {
      throw new ApiInternalServerException(`Invalid timezone provided to DateUtils.build: ${zone}`)
    }

    const dateTime = DateTime.fromJSDate(date, { zone: this.UTC }).setZone(zone)

    if (input.type === 'iso') {
      return dateTime.toFormat(format) as T
    }

    return dateTime.toJSDate() as T
  }

  static asLuxonDate(date?: Date | string, timezone?: string): DateTime {
    const zone = timezone ?? this.UTC

    if (!this.isValidTimezone(zone)) {
      throw new ApiInternalServerException(`Invalid timezone provided to DateUtils.asLuxonDate: ${zone}`)
    }

    if (typeof date === 'string') {
      return DateTime.fromISO(date, { zone }).setZone(zone)
    }

    return DateTime.fromJSDate(date ?? DateTime.now().toJSDate(), { zone })
  }

  static now<T>(input?: NowInput): T {
    const zone = input?.timezone ?? this.UTC

    if (input?.type === 'iso') {
      return DateTime.now().setZone(zone).toISO()! as T
    }

    return DateTime.now().setZone(zone).toJSDate() as T
  }

  static isAfter(date: Date, compareTo: Date): boolean {
    return DateTime.fromJSDate(date) > DateTime.fromJSDate(compareTo)
  }

  static isBefore(date: Date, compareTo: Date): boolean {
    return DateTime.fromJSDate(date) < DateTime.fromJSDate(compareTo)
  }

  static addDays(date: Date, days: number): Date {
    return DateTime.fromJSDate(date).plus({ days }).toJSDate()
  }

  static subtractDays(date: Date, days: number): Date {
    return DateTime.fromJSDate(date).minus({ days }).toJSDate()
  }

  static isValidTimezone(timezone: string): boolean {
    return DateTime.local().setZone(timezone).isValid
  }

  private static get defaultFormat(): string {
    return process.env.DATE_FORMAT ?? this.DEFAULT_DATE_FORMAT
  }

  private static parseDate(val?: Date | string): Date {
    if (!val) return new Date()
    if (val instanceof Date) return val

    const parsed = new Date(val)

    if (isNaN(parsed.getTime())) {
      throw new ApiInternalServerException('Invalid date string provided to DateUtils')
    }

    return parsed
  }
}

type BuildInput = {
  date?: Date | string
  format?: string
  timezone?: string
} & DateInput

type NowInput = DateInput & {
  timezone?: string
}

type DateInput = {
  type: 'iso' | 'js' | 'timestamp'
}
