"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "validateFindByCommandsFilter", {
    enumerable: true,
    get: function() {
        return validateFindByCommandsFilter;
    }
});
const _collection = require("../../utils/collection");
const _exception = require("../../utils/exception");
const _types = require("./types");
const validateFindByCommandsFilter = (filterList)=>{
    const groupList = _collection.CollectionUtil.groupBy(filterList, 'property');
    for(const key in groupList){
        const commands = groupList[`${key}`].map((g)=>g.command);
        const isLikeNotAllowedOperation = commands.filter((g)=>g === _types.DatabaseOperationEnum.CONTAINS || g === _types.DatabaseOperationEnum.NOT_CONTAINS);
        const NOT_ALLOWED_COMBINATION = 2;
        if (isLikeNotAllowedOperation.length === NOT_ALLOWED_COMBINATION) {
            throw new _exception.ApiBadRequestException(`it is not possible to filter: '${key}' with the commands '${commands.join(', ')}'`);
        }
        const isEqualNotAllowedOperation = commands.filter((g)=>g === _types.DatabaseOperationEnum.EQUAL || g === _types.DatabaseOperationEnum.NOT_EQUAL);
        if (isEqualNotAllowedOperation.length === NOT_ALLOWED_COMBINATION) {
            throw new _exception.ApiBadRequestException(`it is not possible to filter: '${key}' with the commands '${commands.join(', ')}'`);
        }
    }
};

//# sourceMappingURL=util.js.map