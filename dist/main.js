"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
require("./utils/tracing");
const _common = require("@nestjs/common");
const _core = require("@nestjs/core");
const _swagger = require("@nestjs/swagger");
const _bodyparser = /*#__PURE__*/ _interop_require_default(require("body-parser"));
const _colorette = require("colorette");
const _expressratelimit = require("express-rate-limit");
const _helmet = /*#__PURE__*/ _interop_require_default(require("helmet"));
const _packagejson = require("../package.json");
const _appmodule = require("./app.module");
const _user = require("./core/user/repository/user");
const _createuseradmin = require("./infra/database/mongo/seed/create-user-admin");
const _adapter = require("./infra/logger/adapter");
const _secrets = require("./infra/secrets");
const _exception = require("./utils/exception");
const _httpexceptionfilter = require("./utils/filters/http-exception.filter");
const _httpexceptioninterceptor = require("./utils/interceptors/http-exception.interceptor");
const _httploggerinterceptor = require("./utils/interceptors/http-logger.interceptor");
const _metricsinterceptor = require("./utils/interceptors/metrics.interceptor");
const _tracinginterceptor = require("./utils/interceptors/tracing.interceptor");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function bootstrap() {
    const app = await _core.NestFactory.create(_appmodule.AppModule, {
        bufferLogs: true,
        cors: true
    });
    const loggerService = app.get(_adapter.ILoggerAdapter);
    loggerService.setApplication(_packagejson.name);
    app.useLogger(loggerService);
    app.useGlobalFilters(new _httpexceptionfilter.AppExceptionFilter(loggerService));
    app.useGlobalInterceptors(new _httpexceptioninterceptor.ExceptionInterceptor(loggerService), new _httploggerinterceptor.HttpLoggerInterceptor(), new _tracinginterceptor.TracingInterceptor(loggerService), new _metricsinterceptor.MetricsInterceptor());
    app.setGlobalPrefix('api', {
        exclude: [
            {
                path: 'health',
                method: _common.RequestMethod.GET
            },
            {
                path: '/',
                method: _common.RequestMethod.GET
            }
        ]
    });
    app.use((0, _helmet.default)());
    const { ENV, MONGO_URL, POSTGRES_URL, PORT, HOST, ZIPKIN_URL, PROMETHUES_URL, RATE_LIMIT_BY_USER } = app.get(_secrets.ISecretsAdapter);
    const limiter = (0, _expressratelimit.rateLimit)({
        windowMs: 15 * 60 * 1000,
        limit: RATE_LIMIT_BY_USER,
        standardHeaders: 'draft-7',
        legacyHeaders: false
    });
    app.use(limiter);
    app.use(_bodyparser.default.urlencoded());
    app.enableVersioning({
        type: _common.VersioningType.URI
    });
    process.on('uncaughtException', (error)=>{
        if (!(error instanceof _exception.BaseException)) {
            const customError = new _exception.ApiInternalServerException(error?.message);
            customError.stack = error.stack;
            loggerService.fatal(customError);
        }
    });
    const config = new _swagger.DocumentBuilder().setTitle(_packagejson.name).setDescription(_packagejson.description).addBearerAuth().setVersion(_packagejson.version).addServer(HOST).addTag('Swagger Documentation').build();
    const document = _swagger.SwaggerModule.createDocument(app, config);
    _swagger.SwaggerModule.setup('docs', app, document);
    loggerService.log(`🟢 ${_packagejson.name} listening at ${(0, _colorette.bold)(PORT)} on ${(0, _colorette.bold)(ENV?.toUpperCase())} 🟢\n`);
    loggerService.log(`🟢 Swagger listening at ${(0, _colorette.bold)(`${HOST}/docs`)} 🟢\n`);
    await app.listen(PORT);
    loggerService.log(`🔵 Postgres listening at ${(0, _colorette.bold)(POSTGRES_URL)}`);
    loggerService.log(`🔵 Mongo listening at ${(0, _colorette.bold)(MONGO_URL)}\n`);
    loggerService.log(`⚪ Zipkin[${(0, _colorette.bold)('Tracing')}] listening at ${(0, _colorette.bold)(ZIPKIN_URL)}`);
    loggerService.log(`⚪ Promethues[${(0, _colorette.bold)('Metrics')}] listening at ${(0, _colorette.bold)(PROMETHUES_URL)}`);
    const userRepository = app.get(_user.IUserRepository);
    await userRepository.seed([
        _createuseradmin.UserAdminSeed
    ]);
}
bootstrap();

//# sourceMappingURL=main.js.map