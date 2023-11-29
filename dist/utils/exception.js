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
    ApiBadRequestException: function() {
        return ApiBadRequestException;
    },
    ApiConflictException: function() {
        return ApiConflictException;
    },
    ApiForbiddenException: function() {
        return ApiForbiddenException;
    },
    ApiInternalServerException: function() {
        return ApiInternalServerException;
    },
    ApiNotFoundException: function() {
        return ApiNotFoundException;
    },
    ApiUnauthorizedException: function() {
        return ApiUnauthorizedException;
    },
    BaseException: function() {
        return BaseException;
    }
});
const _common = require("@nestjs/common");
let BaseException = class BaseException extends _common.HttpException {
    constructor(message, status, parameters){
        super(message, status);
        if (parameters) {
            this.parameters = parameters;
        }
        this.statusCode = super.getStatus();
        Error.captureStackTrace(this);
    }
};
let ApiInternalServerException = class ApiInternalServerException extends BaseException {
    constructor(message, parameters){
        super(message ?? 'InternalServerException', 500, parameters);
    }
};
let ApiNotFoundException = class ApiNotFoundException extends BaseException {
    constructor(message, parameters){
        super(message ?? 'NotFoundException', 404, parameters);
    }
};
let ApiConflictException = class ApiConflictException extends BaseException {
    constructor(message, parameters){
        super(message ?? 'ConflictException', 409, parameters);
    }
};
let ApiUnauthorizedException = class ApiUnauthorizedException extends BaseException {
    constructor(message, parameters){
        super(message ?? 'UnauthorizedException', 401, parameters);
    }
};
let ApiBadRequestException = class ApiBadRequestException extends BaseException {
    constructor(message, parameters){
        super(message ?? 'BadRequestException', 400, parameters);
    }
};
let ApiForbiddenException = class ApiForbiddenException extends BaseException {
    constructor(message, parameters){
        super(message ?? 'BadRequestException', 403, parameters);
    }
};

//# sourceMappingURL=exception.js.map