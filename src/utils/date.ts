import { DateTime } from 'luxon';

export class DateUtils {
  private static readonly DEFAULT_TIMEZONE = 'UTC';
  private static readonly DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';
  private static readonly APP_TIMEZONE = process.env.TZ || this.DEFAULT_TIMEZONE;

  static getDateStringWithFormat(input: Partial<GetDateWithFormatFormatInput> = {}): string {
    const date = input.date ?? this.getJSDate();
    const format = input.format ?? process.env.DATE_FORMAT ?? this.DEFAULT_DATE_FORMAT;

    return DateTime.fromJSDate(date, { zone: 'utc' }).setZone(this.APP_TIMEZONE).toFormat(format);
  }

  static getISODateString(): string {
    return DateTime.fromJSDate(this.getJSDate(), { zone: 'utc' }).setZone(this.APP_TIMEZONE).toISO()!;
  }

  static getJSDate(): Date {
    return DateTime.now().setZone(this.APP_TIMEZONE).toJSDate();
  }

  static createJSDate({ date, utc = true }: CreateDateInput): Date {
    const dateTime = utc ? DateTime.fromISO(date, { zone: 'utc' }) : DateTime.fromISO(date);

    return dateTime.setZone(this.APP_TIMEZONE).toJSDate();
  }

  static createISODate({ date, utc = true }: CreateDateInput): string {
    const dateTime = utc ? DateTime.fromISO(date, { zone: 'utc' }) : DateTime.fromISO(date);

    return dateTime.setZone(this.APP_TIMEZONE).toISO()!;
  }

  static getDate(): DateTime {
    return DateTime.now().setZone(this.APP_TIMEZONE);
  }

  static isAfter(date: Date, compareTo: Date): boolean {
    return DateTime.fromJSDate(date) > DateTime.fromJSDate(compareTo);
  }

  static isBefore(date: Date, compareTo: Date): boolean {
    return DateTime.fromJSDate(date) < DateTime.fromJSDate(compareTo);
  }

  static addDays(date: Date, days: number): Date {
    return DateTime.fromJSDate(date).plus({ days }).toJSDate();
  }

  static subtractDays(date: Date, days: number): Date {
    return DateTime.fromJSDate(date).minus({ days }).toJSDate();
  }

  static isValidTimezone(timezone: string): boolean {
    try {
      DateTime.now().setZone(timezone);
      return true;
    } catch {
      return false;
    }
  }
}

type GetDateWithFormatFormatInput = {
  date?: Date;
  format?: string;
};

type CreateDateInput = {
  date: string;
  utc?: boolean;
  timezone?: string;
};
