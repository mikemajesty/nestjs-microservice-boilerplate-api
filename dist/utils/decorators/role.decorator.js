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
    ROLES_KEY: function() {
        return ROLES_KEY;
    },
    Roles: function() {
        return Roles;
    }
});
const _common = require("@nestjs/common");
const ROLES_KEY = 'roles';
const Roles = (...roles)=>(0, _common.SetMetadata)(ROLES_KEY, roles);

//# sourceMappingURL=role.decorator.js.map