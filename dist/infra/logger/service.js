"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LoggerService", {
    enumerable: true,
    get: function() {
        return LoggerService;
    }
});
const _common = require("@nestjs/common");
const _colorette = require("colorette");
const _convertpinorequesttocurl = require("convert-pino-request-to-curl");
const _pino = require("pino");
const _pinohttp = require("pino-http");
const _pinopretty = /*#__PURE__*/ _interop_require_default(require("pino-pretty"));
const _uuid = require("uuid");
const _date = require("../../utils/date");
const _exception = require("../../utils/exception");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let LoggerService = class LoggerService {
    async connect(logLevel) {
        const pinoLogger = (0, _pino.pino)({
            useLevelLabels: true,
            level: [
                logLevel,
                'trace'
            ].find(Boolean).toString()
        }, (0, _pino.multistream)([
            {
                level: 'trace',
                stream: (0, _pinopretty.default)(this.getPinoConfig())
            },
            {
                level: 'info',
                stream: _pino.pino.transport({
                    target: 'pino-mongodb',
                    options: {
                        uri: process.env.MONGO_URL,
                        collection: 'log-collection'
                    }
                })
            }
        ]));
        this.logger = (0, _pinohttp.pinoHttp)(this.getPinoHttpConfig(pinoLogger));
    }
    setApplication(app) {
        this.app = app;
    }
    log(message) {
        this.logger.logger.trace((0, _colorette.green)(message));
    }
    trace({ message, context, obj = {} }) {
        Object.assign(obj, {
            context,
            createdAt: _date.DateUtils.getISODateString()
        });
        this.logger.logger.trace([
            obj,
            (0, _colorette.gray)(message)
        ].find(Boolean), (0, _colorette.gray)(message));
    }
    info({ message, context, obj = {} }) {
        Object.assign(obj, {
            context,
            createdAt: _date.DateUtils.getISODateString()
        });
        this.logger.logger.info([
            obj,
            message
        ].find(Boolean), message);
    }
    warn({ message, context, obj = {} }) {
        Object.assign(obj, {
            context,
            createdAt: _date.DateUtils.getISODateString()
        });
        this.logger.logger.warn([
            obj,
            message
        ].find(Boolean), message);
    }
    error(error, message, context) {
        const errorResponse = this.getErrorResponse(error);
        const response = error instanceof _exception.BaseException ? {
            statusCode: error['statusCode'],
            message: error?.message,
            ...error?.parameters
        } : errorResponse?.value();
        const type = {
            Error: _exception.BaseException.name
        }[error?.name];
        const messageFind = [
            message,
            response?.message,
            error.message
        ].find(Boolean);
        this.logger.logger.error({
            ...response,
            context: context,
            type: [
                type,
                error?.name
            ].find(Boolean),
            traceid: this.getTraceId(error),
            createdAt: _date.DateUtils.getISODateString(),
            application: this.app,
            stack: error.stack,
            ...error?.parameters,
            message: messageFind
        }, messageFind);
    }
    fatal(error, message, context) {
        this.logger.logger.fatal({
            message: error.message || message,
            context: context,
            type: error.name,
            traceid: this.getTraceId(error),
            createdAt: _date.DateUtils.getISODateString(),
            application: this.app,
            stack: error.stack
        }, error.message || message);
        process.exit(1);
    }
    getPinoConfig() {
        return {
            colorize: _colorette.isColorSupported,
            levelFirst: true,
            ignore: 'pid,hostname',
            quietReqLogger: true,
            messageFormat: (log, messageKey)=>{
                const message = log[String(messageKey)];
                if (this.app) {
                    return `[${(0, _colorette.blue)(this.app)}] ${message}`;
                }
                return message;
            },
            customPrettifiers: {
                time: ()=>{
                    return `[${_date.DateUtils.getDateStringWithFormat()}]`;
                }
            }
        };
    }
    getPinoHttpConfig(pinoLogger) {
        return {
            logger: pinoLogger,
            quietReqLogger: true,
            customSuccessMessage: (req, res)=>{
                return `request ${res.statusCode >= 400 ? 'erro' : 'success'} with status code: ${res.statusCode}`;
            },
            customErrorMessage: (req, res, error)=>{
                return `request ${error.name} with status code: ${res.statusCode} `;
            },
            customAttributeKeys: {
                req: 'request',
                res: 'response',
                err: 'error',
                responseTime: 'timeTaken',
                reqId: 'traceid'
            },
            serializers: {
                err: ()=>false,
                req: (request)=>{
                    return {
                        method: request.method,
                        curl: _convertpinorequesttocurl.PinoRequestConverter.getCurl(request)
                    };
                },
                res: _pino.pino.stdSerializers.res
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            customProps: (req)=>{
                const context = req.context;
                const traceid = [
                    req?.headers?.traceid,
                    req.id
                ].find(Boolean);
                const path = `${req.protocol}://${req.headers.host}${req.url}`;
                this.logger.logger.setBindings({
                    traceid,
                    application: this.app,
                    context: context,
                    createdAt: _date.DateUtils.getISODateString()
                });
                return {
                    traceid,
                    application: this.app,
                    context: context,
                    path,
                    createdAt: _date.DateUtils.getISODateString()
                };
            },
            customLogLevel: (req, res, error)=>{
                if ([
                    res.statusCode >= 400,
                    error
                ].some(Boolean)) {
                    return 'error';
                }
                if ([
                    res.statusCode >= 300,
                    res.statusCode <= 400
                ].every(Boolean)) {
                    return 'silent';
                }
                return 'info';
            }
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getErrorResponse(error) {
        const isFunction = typeof error?.getResponse === 'function';
        return [
            {
                conditional: typeof error === 'string',
                value: ()=>new _common.InternalServerErrorException(error).getResponse()
            },
            {
                conditional: isFunction && typeof error.getResponse() === 'string',
                value: ()=>new _exception.BaseException(error.getResponse(), [
                        error.getStatus(),
                        error['status']
                    ].find(Boolean)).getResponse()
            },
            {
                conditional: isFunction && typeof error.getResponse() === 'object',
                value: ()=>error?.getResponse()
            },
            {
                conditional: [
                    error?.name === Error.name,
                    error?.name == TypeError.name
                ].some(Boolean),
                value: ()=>new _common.InternalServerErrorException(error.message).getResponse()
            }
        ].find((c)=>c.conditional);
    }
    getTraceId(error) {
        if (typeof error === 'string') return (0, _uuid.v4)();
        return [
            error.traceid,
            this.logger.logger.bindings()?.traceid
        ].find(Boolean);
    }
};
LoggerService = _ts_decorate([
    (0, _common.Injectable)({
        scope: _common.Scope.REQUEST
    })
], LoggerService);

//# sourceMappingURL=service.js.map