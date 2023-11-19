"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateUtils = void 0;
const luxon_1 = require("luxon");
class DateUtils {
    static getDateStringWithFormat(input = {}) {
        if (!(input === null || input === void 0 ? void 0 : input.date)) {
            Object.assign(input, { date: new Date() });
        }
        if (!(input === null || input === void 0 ? void 0 : input.format)) {
            Object.assign(input, { format: process.env.DATE_FORMAT });
        }
        return luxon_1.DateTime.fromJSDate(input.date, { zone: 'utc' }).setZone(process.env.TZ).toFormat(input.format);
    }
    static getISODateString() {
        return luxon_1.DateTime.fromJSDate(new Date(), { zone: 'utc' }).setZone(process.env.TZ).toJSON();
    }
    static getJSDate() {
        return luxon_1.DateTime.fromJSDate(new Date(), { zone: 'utc' }).setZone(process.env.TZ).toJSDate();
    }
    static getDate() {
        return luxon_1.DateTime.fromJSDate(new Date(), { zone: 'utc' }).setZone(process.env.TZ);
    }
}
exports.DateUtils = DateUtils;
//# sourceMappingURL=date.js.map