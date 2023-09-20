"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./utils/tracing");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const colorette_1 = require("colorette");
const package_json_1 = require("../package.json");
const app_module_1 = require("./app.module");
const user_1 = require("./core/user/repository/user");
const create_user_admin_1 = require("./infra/database/mongo/seed/create-user-admin");
const adapter_1 = require("./infra/logger/adapter");
const secrets_1 = require("./infra/secrets");
const exception_1 = require("./utils/exception");
const http_exception_filter_1 = require("./utils/filters/http-exception.filter");
const http_exception_interceptor_1 = require("./utils/interceptors/http-exception.interceptor");
const http_logger_interceptor_1 = require("./utils/interceptors/http-logger.interceptor");
const metrics_interceptor_1 = require("./utils/interceptors/metrics.interceptor");
const tracing_interceptor_1 = require("./utils/interceptors/tracing.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
        cors: true
    });
    const loggerService = app.get(adapter_1.ILoggerAdapter);
    loggerService.setApplication(package_json_1.name);
    app.useLogger(loggerService);
    app.useGlobalFilters(new http_exception_filter_1.AppExceptionFilter(loggerService));
    app.useGlobalInterceptors(new http_exception_interceptor_1.ExceptionInterceptor(loggerService), new http_logger_interceptor_1.HttpLoggerInterceptor(), new tracing_interceptor_1.TracingInterceptor(loggerService), new metrics_interceptor_1.MetricsInterceptor());
    app.setGlobalPrefix('api', {
        exclude: [
            { path: 'health', method: common_1.RequestMethod.GET },
            { path: '/', method: common_1.RequestMethod.GET }
        ]
    });
    process.on('uncaughtException', (error) => {
        if (!(error instanceof exception_1.BaseException)) {
            const customError = new exception_1.ApiInternalServerException(error === null || error === void 0 ? void 0 : error.message);
            customError.stack = error.stack;
            loggerService.fatal(customError);
        }
    });
    const { ENV, MONGO_URL, POSTGRES_URL, PORT, HOST, JEAGER_URL } = app.get(secrets_1.ISecretsAdapter);
    const config = new swagger_1.DocumentBuilder()
        .setTitle(package_json_1.name)
        .setDescription(package_json_1.description)
        .addBearerAuth()
        .setVersion(package_json_1.version)
        .addServer(HOST)
        .addTag('Swagger Documentation')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    loggerService.log(`🟢 ${package_json_1.name} listening at ${(0, colorette_1.bold)(PORT)} on ${(0, colorette_1.bold)(ENV === null || ENV === void 0 ? void 0 : ENV.toUpperCase())} 🟢\n`);
    loggerService.log(`🟢 Swagger listening at ${(0, colorette_1.bold)(`${HOST}/docs`)} 🟢\n`);
    await app.listen(PORT);
    loggerService.log(`🔵 Postgres listening at ${(0, colorette_1.bold)(POSTGRES_URL)}`);
    loggerService.log(`🔵 Mongo listening at ${(0, colorette_1.bold)(MONGO_URL)}`);
    loggerService.log(`🔵 jeager listening at ${(0, colorette_1.bold)(JEAGER_URL)}`);
    const userRepository = app.get(user_1.IUserRepository);
    await userRepository.seed([create_user_admin_1.UserAdminSeed]);
}
bootstrap();
//# sourceMappingURL=main.js.map