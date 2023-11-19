"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFindByCommandsFilter = void 0;
const collection_1 = require("../../utils/collection");
const exception_1 = require("../../utils/exception");
const types_1 = require("./types");
const validateFindByCommandsFilter = (filterList) => {
    const groupList = collection_1.CollectionUtil.groupBy(filterList, 'property');
    for (const key in groupList) {
        const commands = groupList[`${key}`].map((g) => g.command);
        const isLikeNotAllowedOperation = commands.filter((g) => g === types_1.DatabaseOperationEnum.CONTAINS || g === types_1.DatabaseOperationEnum.NOT_CONTAINS);
        const NOT_ALLOWED_COMBINATION = 2;
        if (isLikeNotAllowedOperation.length === NOT_ALLOWED_COMBINATION) {
            throw new exception_1.ApiBadRequestException(`it is not possible to filter: '${key}' with the commands '${commands.join(', ')}'`);
        }
        const isEqualNotAllowedOperation = commands.filter((g) => g === types_1.DatabaseOperationEnum.EQUAL || g === types_1.DatabaseOperationEnum.NOT_EQUAL);
        if (isEqualNotAllowedOperation.length === NOT_ALLOWED_COMBINATION) {
            throw new exception_1.ApiBadRequestException(`it is not possible to filter: '${key}' with the commands '${commands.join(', ')}'`);
        }
    }
};
exports.validateFindByCommandsFilter = validateFindByCommandsFilter;
//# sourceMappingURL=util.js.map