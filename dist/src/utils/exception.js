"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiForbiddenException = exports.ApiBadRequestException = exports.ApiUnauthorizedException = exports.ApiConflictException = exports.ApiNotFoundException = exports.ApiInternalServerException = exports.BaseException = void 0;
const common_1 = require("@nestjs/common");
class BaseException extends common_1.HttpException {
    constructor(message, status, parameters) {
        super(message, status);
        if (parameters) {
            this.parameters = parameters;
        }
        this.statusCode = super.getStatus();
        Error.captureStackTrace(this);
    }
}
exports.BaseException = BaseException;
class ApiInternalServerException extends BaseException {
    constructor(message, parameters) {
        super(message !== null && message !== void 0 ? message : 'InternalServerException', 500, parameters);
    }
}
exports.ApiInternalServerException = ApiInternalServerException;
class ApiNotFoundException extends BaseException {
    constructor(message, parameters) {
        super(message !== null && message !== void 0 ? message : 'NotFoundException', 404, parameters);
    }
}
exports.ApiNotFoundException = ApiNotFoundException;
class ApiConflictException extends BaseException {
    constructor(message, parameters) {
        super(message !== null && message !== void 0 ? message : 'ConflictException', 409, parameters);
    }
}
exports.ApiConflictException = ApiConflictException;
class ApiUnauthorizedException extends BaseException {
    constructor(message, parameters) {
        super(message !== null && message !== void 0 ? message : 'UnauthorizedException', 401, parameters);
    }
}
exports.ApiUnauthorizedException = ApiUnauthorizedException;
class ApiBadRequestException extends BaseException {
    constructor(message, parameters) {
        super(message !== null && message !== void 0 ? message : 'BadRequestException', 400, parameters);
    }
}
exports.ApiBadRequestException = ApiBadRequestException;
class ApiForbiddenException extends BaseException {
    constructor(message, parameters) {
        super(message !== null && message !== void 0 ? message : 'BadRequestException', 403, parameters);
    }
}
exports.ApiForbiddenException = ApiForbiddenException;
//# sourceMappingURL=exception.js.map