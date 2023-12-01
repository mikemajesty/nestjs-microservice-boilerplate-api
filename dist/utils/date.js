"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DateUtils", {
    enumerable: true,
    get: function() {
        return DateUtils;
    }
});
const _luxon = require("luxon");
let DateUtils = class DateUtils {
    static getDateStringWithFormat(input = {}) {
        if (!input?.date) {
            Object.assign(input, {
                date: new Date()
            });
        }
        if (!input?.format) {
            Object.assign(input, {
                format: process.env.DATE_FORMAT
            });
        }
        return _luxon.DateTime.fromJSDate(input.date, {
            zone: 'utc'
        }).setZone(process.env.TZ).toFormat(input.format);
    }
    static getISODateString() {
        return _luxon.DateTime.fromJSDate(new Date(), {
            zone: 'utc'
        }).setZone(process.env.TZ).toJSON();
    }
    static getJSDate() {
        return _luxon.DateTime.fromJSDate(new Date(), {
            zone: 'utc'
        }).setZone(process.env.TZ).toJSDate();
    }
    static getDate() {
        return _luxon.DateTime.fromJSDate(new Date(), {
            zone: 'utc'
        }).setZone(process.env.TZ);
    }
};

//# sourceMappingURL=date.js.map