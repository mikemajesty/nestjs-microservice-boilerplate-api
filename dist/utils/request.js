"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getPathWithoutUUID", {
    enumerable: true,
    get: function() {
        return getPathWithoutUUID;
    }
});
const getPathWithoutUUID = (path)=>path.replace(/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/, 'uuid');

//# sourceMappingURL=request.js.map