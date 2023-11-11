import { DateTime } from 'luxon';

type GetDateWithFormatFormatInput = {
  date?: Date;
  format?: string;
};

export class DateUtils {
  static getDateStringWithFormat(input: Partial<GetDateWithFormatFormatInput> = {}): string {
    if (!input?.date) {
      Object.assign(input, { date: new Date() });
    }

    if (!input?.format) {
      Object.assign(input, { format: process.env.DATE_FORMAT });
    }

    return DateTime.fromJSDate(input.date, { zone: 'utc' }).setZone(process.env.TZ).toFormat(input.format);
  }

  static getISODateString(): string {
    return DateTime.fromJSDate(new Date(), { zone: 'utc' }).setZone(process.env.TZ).toJSON();
  }

  static getJSDate(): Date {
    return DateTime.fromJSDate(new Date(), { zone: 'utc' }).setZone(process.env.TZ).toJSDate();
  }

  static getDate(): DateTime {
    return DateTime.fromJSDate(new Date(), { zone: 'utc' }).setZone(process.env.TZ);
  }
}
