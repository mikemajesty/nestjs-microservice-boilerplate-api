import { DateTime, DurationUnit } from 'luxon';

type GetDateWithFormatFormatInput = {
  date?: Date;
  format?: string;
};

type CreateDateInput = {
  date: string;
  utc: boolean;
};

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

  static getISODateString(): string | null {
    return DateTime.fromJSDate(DateUtils.getJSDate(), { zone: 'utc' }).setZone(process.env.TZ).toJSON();
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

  static createISODate({ date, utc = true }: CreateDateInput): string | null {
    if (utc) {
      return DateTime.fromISO(date, { zone: 'utc' }).setZone(process.env.TZ).toISO();
    }
    return DateTime.fromISO(date).setZone(process.env.TZ).toISO();
  }

  static calculateDiff(date: Date, compareDate: Date, compareType: DurationUnit): Date {
    const date1 = DateTime.fromJSDate(date, { zone: 'utc' }).setZone(process.env.TZ);
    const date2 = DateTime.fromJSDate(compareDate, { zone: 'utc' }).setZone(process.env.TZ);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (date1.diff(date2, compareType) as any)[`${compareType}`];
  }

  static getDate(): DateTime {
    return DateTime.fromJSDate(DateUtils.getJSDate(), { zone: 'utc' }).setZone(process.env.TZ);
  }
}
