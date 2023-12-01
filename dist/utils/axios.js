"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    interceptAxiosResponseError: function() {
        return interceptAxiosResponseError;
    },
    requestRetry: function() {
        return requestRetry;
    }
});
const _axiosretry = /*#__PURE__*/ _interop_require_default(require("axios-retry"));
const _nestjsconverttocurl = require("nestjs-convert-to-curl");
const _exception = require("./exception");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const interceptAxiosResponseError = (error, logger)=>{
    error.stack = error.stack.replace(/AxiosError.*node:internal\/process\/task_queues:[0-9]+:[0-9]+\).*axiosBetterStacktrace.ts:[0-9]+:[0-9]+\)/g, '');
    const status = [
        error?.response?.data?.code,
        error?.response?.data?.error?.code,
        error?.response?.status,
        500
    ].find(Boolean);
    const message = [
        error?.response?.data?.description,
        error?.response?.data?.error?.message,
        error?.response?.statusText,
        'Internal Server Error'
    ].find(Boolean);
    const curl = _nestjsconverttocurl.AxiosConverter.getCurl(error);
    logger.error(new _exception.BaseException(typeof error['code'] === 'string' ? error['code'] : message, status, {
        curl,
        responseData: error?.response?.data ?? undefined
    }));
};
const requestRetry = ({ axios, logger, status: statusRetry = [
    503,
    422,
    408
] })=>{
    (0, _axiosretry.default)(axios, {
        shouldResetTimeout: true,
        retryDelay: (retryCount, axiosError)=>{
            logger.warn({
                message: `retry attempt: ${retryCount}`,
                obj: {
                    statusText: [
                        axiosError.response?.data['message'],
                        axiosError.message
                    ].find(Boolean),
                    status: [
                        axiosError.response?.status,
                        axiosError.status,
                        axiosError.response?.data['status'],
                        axiosError?.response?.data['code'],
                        axiosError.code
                    ].find(Boolean),
                    url: axiosError.config.url
                }
            });
            return retryCount * 2000;
        },
        retryCondition: (error)=>{
            const status = error?.response?.status || 500;
            return statusRetry.includes(status);
        }
    });
};

//# sourceMappingURL=axios.js.map