"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPathWithoutUUID = void 0;
const getPathWithoutUUID = (path) => path.replace(/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/, 'uuid');
exports.getPathWithoutUUID = getPathWithoutUUID;
//# sourceMappingURL=request.js.map