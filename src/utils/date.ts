import { DateTime, DurationUnit } from 'luxon';

type GetDateWithFormatFormatInput = {
  date?: Date;
  format?: string;
};

export class DateUtils {
  static getDateStringWithFormat(input: Partial<GetDateWithFormatFormatInput> = {}): string {
    if (!input?.date) {
      Object.assign(input, { date: DateUtils.getJSDate() });
    }

    if (!input?.format) {
      Object.assign(input, { format: process.env.DATE_FORMAT });
    }

    return DateTime.fromJSDate(input.date, { zone: 'utc' }).setZone(process.env.TZ).toFormat(input.format);
  }

  static getISODateString(): string {
    return DateTime.fromJSDate(DateUtils.getJSDate(), { zone: 'utc' }).setZone(process.env.TZ).toJSON();
  }

  static getJSDate(date?: Date): Date {
    return DateTime.fromJSDate(date ?? DateTime.now().toJSDate(), { zone: 'utc' })
      .setZone(process.env.TZ)
      .toJSDate();
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
