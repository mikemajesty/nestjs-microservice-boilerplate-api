"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RequestMock", {
    enumerable: true,
    get: function() {
        return RequestMock;
    }
});
let RequestMock = class RequestMock {
};
RequestMock.trancingMock = {
    tracing: {
        logEvent (key, value) {
            return key + value;
        },
        setStatus (event) {
            return event;
        }
    },
    user: {
        login: 'test'
    }
};

//# sourceMappingURL=request.js.map