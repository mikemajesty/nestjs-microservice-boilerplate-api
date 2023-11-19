"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const common_1 = require("@nestjs/common");
const colorette_1 = require("colorette");
const convert_pino_request_to_curl_1 = require("convert-pino-request-to-curl");
const pino_1 = require("pino");
const pino_http_1 = require("pino-http");
const pino_pretty_1 = __importDefault(require("pino-pretty"));
const uuid_1 = require("uuid");
const date_1 = require("../../utils/date");
const exception_1 = require("../../utils/exception");
let LoggerService = exports.LoggerService = class LoggerService {
    async connect(logLevel) {
        const pinoLogger = (0, pino_1.pino)({
            useLevelLabels: true,
            level: [logLevel, 'trace'].find(Boolean).toString()
        }, (0, pino_1.multistream)([
            {
                level: 'trace',
                stream: (0, pino_pretty_1.default)(this.getPinoConfig())
            },
            {
                level: 'info',
                stream: pino_1.pino.transport({
                    target: 'pino-mongodb',
                    options: {
                        uri: process.env.MONGO_URL,
                        collection: 'log-collection'
                    }
                })
            }
        ]));
        this.logger = (0, pino_http_1.pinoHttp)(this.getPinoHttpConfig(pinoLogger));
    }
    setApplication(app) {
        this.app = app;
    }
    log(message) {
        this.logger.logger.trace((0, colorette_1.green)(message));
    }
    trace({ message, context, obj = {} }) {
        Object.assign(obj, { context, createdAt: date_1.DateUtils.getISODateString() });
        this.logger.logger.trace([obj, (0, colorette_1.gray)(message)].find(Boolean), (0, colorette_1.gray)(message));
    }
    info({ message, context, obj = {} }) {
        Object.assign(obj, { context, createdAt: date_1.DateUtils.getISODateString() });
        this.logger.logger.info([obj, message].find(Boolean), message);
    }
    warn({ message, context, obj = {} }) {
        Object.assign(obj, { context, createdAt: date_1.DateUtils.getISODateString() });
        this.logger.logger.warn([obj, message].find(Boolean), message);
    }
    error(error, message, context) {
        const errorResponse = this.getErrorResponse(error);
        const response = error instanceof exception_1.BaseException
            ? Object.assign({ statusCode: error['statusCode'], message: error === null || error === void 0 ? void 0 : error.message }, error === null || error === void 0 ? void 0 : error.parameters) : errorResponse === null || errorResponse === void 0 ? void 0 : errorResponse.value();
        const type = {
            Error: exception_1.BaseException.name
        }[error === null || error === void 0 ? void 0 : error.name];
        const messageFind = [message, response === null || response === void 0 ? void 0 : response.message, error.message].find(Boolean);
        this.logger.logger.error(Object.assign(Object.assign(Object.assign(Object.assign({}, response), { context: context, type: [type, error === null || error === void 0 ? void 0 : error.name].find(Boolean), traceid: this.getTraceId(error), createdAt: date_1.DateUtils.getISODateString(), application: this.app, stack: error.stack }), error === null || error === void 0 ? void 0 : error.parameters), { message: messageFind }), messageFind);
    }
    fatal(error, message, context) {
        this.logger.logger.fatal({
            message: error.message || message,
            context: context,
            type: error.name,
            traceid: this.getTraceId(error),
            createdAt: date_1.DateUtils.getISODateString(),
            application: this.app,
            stack: error.stack
        }, error.message || message);
        process.exit(1);
    }
    getPinoConfig() {
        return {
            colorize: colorette_1.isColorSupported,
            levelFirst: true,
            ignore: 'pid,hostname',
            quietReqLogger: true,
            messageFormat: (log, messageKey) => {
                const message = log[String(messageKey)];
                if (this.app) {
                    return `[${(0, colorette_1.blue)(this.app)}] ${message}`;
                }
                return message;
            },
            customPrettifiers: {
                time: () => {
                    return `[${date_1.DateUtils.getDateStringWithFormat()}]`;
                }
            }
        };
    }
    getPinoHttpConfig(pinoLogger) {
        return {
            logger: pinoLogger,
            quietReqLogger: true,
            customSuccessMessage: (req, res) => {
                return `request ${res.statusCode >= 400 ? 'erro' : 'success'} with status code: ${res.statusCode}`;
            },
            customErrorMessage: (req, res, error) => {
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
                err: () => false,
                req: (request) => {
                    return {
                        method: request.method,
                        curl: convert_pino_request_to_curl_1.PinoRequestConverter.getCurl(request)
                    };
                },
                res: pino_1.pino.stdSerializers.res
            },
            customProps: (req) => {
                var _a;
                const context = req.context;
                const traceid = [(_a = req === null || req === void 0 ? void 0 : req.headers) === null || _a === void 0 ? void 0 : _a.traceid, req.id].find(Boolean);
                const path = `${req.protocol}://${req.headers.host}${req.url}`;
                this.logger.logger.setBindings({
                    traceid,
                    application: this.app,
                    context: context,
                    createdAt: date_1.DateUtils.getISODateString()
                });
                return {
                    traceid,
                    application: this.app,
                    context: context,
                    path,
                    createdAt: date_1.DateUtils.getISODateString()
                };
            },
            customLogLevel: (req, res, error) => {
                if ([res.statusCode >= 400, error].some(Boolean)) {
                    return 'error';
                }
                if ([res.statusCode >= 300, res.statusCode <= 400].every(Boolean)) {
                    return 'silent';
                }
                return 'info';
            }
        };
    }
    getErrorResponse(error) {
        const isFunction = typeof (error === null || error === void 0 ? void 0 : error.getResponse) === 'function';
        return [
            {
                conditional: typeof error === 'string',
                value: () => new common_1.InternalServerErrorException(error).getResponse()
            },
            {
                conditional: isFunction && typeof error.getResponse() === 'string',
                value: () => new exception_1.BaseException(error.getResponse(), [error.getStatus(), error['status']].find(Boolean)).getResponse()
            },
            {
                conditional: isFunction && typeof error.getResponse() === 'object',
                value: () => error === null || error === void 0 ? void 0 : error.getResponse()
            },
            {
                conditional: [(error === null || error === void 0 ? void 0 : error.name) === Error.name, (error === null || error === void 0 ? void 0 : error.name) == TypeError.name].some(Boolean),
                value: () => new common_1.InternalServerErrorException(error.message).getResponse()
            }
        ].find((c) => c.conditional);
    }
    getTraceId(error) {
        var _a;
        if (typeof error === 'string')
            return (0, uuid_1.v4)();
        return [error.traceid, (_a = this.logger.logger.bindings()) === null || _a === void 0 ? void 0 : _a.traceid].find(Boolean);
    }
};
exports.LoggerService = LoggerService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST })
], LoggerService);
//# sourceMappingURL=service.js.map