"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestMock = void 0;
class RequestMock {
}
exports.RequestMock = RequestMock;
RequestMock.trancingMock = {
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