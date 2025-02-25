import { DateTime } from 'luxon';

export class DateUtils {
  static getDateStringWithFormat(input: Partial<GetDateWithFormatFormatInput> = {}): string {
    if (!input?.date) {
      Object.assign(input, { date: DateUtils.getJSDate() });
    }

    if (!input?.format) {
      Object.assign(input, { format: process.env.DATE_FORMAT });
    }

    return DateTime.fromJSDate(input.date as Date, { zone: 'utc' })
      .setZone(process.env.TZ)
      .toFormat(input?.format as string);
  }

  static getISODateString(): string {
    return DateTime.fromJSDate(DateUtils.getJSDate(), { zone: 'utc' }).setZone(process.env.TZ).toJSON() as string;
  }

  static getJSDate(): Date {
    return DateTime.fromJSDate(DateTime.now().toJSDate(), { zone: 'utc' }).setZone(process.env.TZ).toJSDate();
  }

  static createJSDate({ date, utc = true }: CreateDateInput): Date {
    if (utc) {
      return DateTime.fromISO(date, { zone: 'utc' }).setZone(process.env.TZ).toJSDate();
    }
    return DateTime.fromISO(date).setZone(process.env.TZ).toJSDate();
  }

  static createISODate({ date, utc = true }: CreateDateInput): string {
    if (utc) {
      return DateTime.fromISO(date, { zone: 'utc' }).setZone(process.env.TZ).toISO() as string;
    }
    return DateTime.fromISO(date).setZone(process.env.TZ).toISO() as string;
  }

  static getDate(): DateTime {
    return DateTime.fromJSDate(DateUtils.getJSDate(), { zone: 'utc' }).setZone(process.env.TZ);
  }
}

type GetDateWithFormatFormatInput = {
  date?: Date;
  format?: string;
};

type CreateDateInput = {
  date: string;
  utc: boolean;
};
