/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/date.md
 */
import { DateTime } from 'luxon'

import { ApiInternalServerException } from './exception'

export class DateUtils {
  private static readonly DEFAULT_DATE_FORMAT = process.env.DATE_FORMAT
  private static readonly APP_TIMEZONE = process.env.TZ

  static build<T extends Date | string>(input: GetDateWithFormatFormatInput): T {
    const parseDate = (val?: Date | string): Date => {
      if (!val) return this.now<Date>({ type: 'js' })
      if (val instanceof Date) return val
      const parsed = new Date(val)
      if (isNaN(parsed.getTime()))
        throw new ApiInternalServerException('Invalid date string provided to DateUtils.build')
      return parsed
    }

    const date = parseDate(input?.date)
    const format = (input?.format ?? this.DEFAULT_DATE_FORMAT) as string
    const zone = input?.timezone ?? this.APP_TIMEZONE
    if (input.type === 'iso') {
      return DateTime.fromJSDate(date, { zone: 'utc' }).setZone(zone).toFormat(format) as T
    }
    return DateTime.fromJSDate(date, { zone: 'utc' }).setZone(zone).toJSDate() as T
  }

  static asLuxonDate(date?: Date | string): DateTime {
    if (typeof date === 'string') {
      return DateTime.fromISO(date ?? DateTime.now().toISO()).setZone(this.APP_TIMEZONE)
    }
    return DateTime.fromJSDate(date ?? DateTime.now().toJSDate()).setZone(this.APP_TIMEZONE)
  }

  static now<T>(input?: DateInput): T {
    if (input?.type === 'iso') {
      return DateTime.now().setZone(this.APP_TIMEZONE).toISO()! as T
    }
    return DateTime.now().setZone(this.APP_TIMEZONE).toJSDate() as T
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
    try {
      DateTime.now().setZone(timezone)
      return true
    } catch {
      return false
    }
  }
}

type GetDateWithFormatFormatInput = {
  date?: Date | string
  format?: string
  utc?: boolean
  timezone?: string
} & DateInput

type DateInput = {
  type: 'iso' | 'js'
}
