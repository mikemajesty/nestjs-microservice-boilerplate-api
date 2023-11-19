"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestRetry = exports.interceptAxiosResponseError = void 0;
const axios_retry_1 = __importDefault(require("axios-retry"));
const nestjs_convert_to_curl_1 = require("nestjs-convert-to-curl");
const exception_1 = require("./exception");
const interceptAxiosResponseError = (error, logger) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    error.stack = error.stack.replace(/AxiosError.*node:internal\/process\/task_queues:[0-9]+:[0-9]+\).*axiosBetterStacktrace.ts:[0-9]+:[0-9]+\)/g, '');
    const status = [(_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.code, (_e = (_d = (_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.code, (_f = error === null || error === void 0 ? void 0 : error.response) === null || _f === void 0 ? void 0 : _f.status, 500].find(Boolean);
    const message = [
        (_h = (_g = error === null || error === void 0 ? void 0 : error.response) === null || _g === void 0 ? void 0 : _g.data) === null || _h === void 0 ? void 0 : _h.description,
        (_l = (_k = (_j = error === null || error === void 0 ? void 0 : error.response) === null || _j === void 0 ? void 0 : _j.data) === null || _k === void 0 ? void 0 : _k.error) === null || _l === void 0 ? void 0 : _l.message,
        (_m = error === null || error === void 0 ? void 0 : error.response) === null || _m === void 0 ? void 0 : _m.statusText,
        'Internal Server Error'
    ].find(Boolean);
    const curl = nestjs_convert_to_curl_1.AxiosConverter.getCurl(error);
    logger.error(new exception_1.BaseException(typeof error['code'] === 'string' ? error['code'] : message, status, {
        curl,
        responseData: (_p = (_o = error === null || error === void 0 ? void 0 : error.response) === null || _o === void 0 ? void 0 : _o.data) !== null && _p !== void 0 ? _p : undefined
    }));
};
exports.interceptAxiosResponseError = interceptAxiosResponseError;
const requestRetry = ({ axios, logger, status: statusRetry = [503, 422, 408] }) => {
    (0, axios_retry_1.default)(axios, {
        shouldResetTimeout: true,
        retryDelay: (retryCount, axiosError) => {
            var _a, _b, _c, _d;
            logger.warn({
                message: `retry attempt: ${retryCount}`,
                obj: {
                    statusText: [(_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.data['message'], axiosError.message].find(Boolean),
                    status: [
                        (_b = axiosError.response) === null || _b === void 0 ? void 0 : _b.status,
                        axiosError.status,
                        (_c = axiosError.response) === null || _c === void 0 ? void 0 : _c.data['status'],
                        (_d = axiosError === null || axiosError === void 0 ? void 0 : axiosError.response) === null || _d === void 0 ? void 0 : _d.data['code'],
                        axiosError.code
                    ].find(Boolean),
                    url: axiosError.config.url
                }
            });
            return retryCount * 2000;
        },
        retryCondition: (error) => {
            var _a;
            const status = ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status) || 500;
            return statusRetry.includes(status);
        }
    });
};
exports.requestRetry = requestRetry;
//# sourceMappingURL=axios.js.map