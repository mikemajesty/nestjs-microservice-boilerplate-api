"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trancingMock = void 0;
exports.trancingMock = {
    tracing: {
        logEvent(key, value) {
            return key + value;
        },
        setStatus(event) {
            return event;
        }
    },
    user: { login: 'test' }
};
//# sourceMappingURL=request.js.map