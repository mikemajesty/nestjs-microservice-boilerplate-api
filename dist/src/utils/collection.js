"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionUtil = void 0;
const exception_1 = require("./exception");
class CollectionUtil {
}
exports.CollectionUtil = CollectionUtil;
CollectionUtil.groupBy = (collection = [], key) => {
    if (!key.length) {
        throw new exception_1.ApiBadRequestException();
    }
    return collection.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};
CollectionUtil.group = (collection) => {
    return collection.reduce(function (rv, x) {
        (rv[x] = rv[x] || []).push(x);
        return rv;
    }, {});
};
CollectionUtil.maxBy = (collection = [], key) => {
    if (!key.length) {
        throw new exception_1.ApiBadRequestException('key is required');
    }
    return collection.reduce((prev, current) => {
        return Number(prev[key] > current[key]) ? prev : current;
    });
};
CollectionUtil.max = (collection) => {
    return Math.max(...collection.map((c) => Number(c)));
};
CollectionUtil.minBy = (collection = [], key) => {
    if (!key.length) {
        throw new exception_1.ApiBadRequestException('key is required');
    }
    return collection.reduce((prev, current) => {
        return Number(prev[key] > current[key]) ? current : prev;
    });
};
CollectionUtil.min = (collection) => {
    return Math.min(...collection.map((c) => Number(c)));
};
CollectionUtil.sum = (collection = []) => {
    return collection.reduce((prev, current) => {
        return Number(prev) + Number(current);
    });
};
CollectionUtil.sumBy = (collection = [], key) => {
    if (!key.length) {
        throw new exception_1.ApiBadRequestException('key is required');
    }
    return collection.reduce((prev, current) => {
        if (isNaN(prev[key] || 0)) {
            return 0 + Number(current[key]);
        }
        if (prev[key]) {
            return Number(prev[key]) + Number(current[key]);
        }
        return Number(prev) + Number(current[key]);
    });
};
CollectionUtil.hasDuplicated = (collection = []) => {
    return new Set(collection).size !== collection.length;
};
CollectionUtil.hasDuplicatedBy = (collection = [], key) => {
    if (!key.length) {
        throw new exception_1.ApiBadRequestException('key is required');
    }
    return new Set(collection.map((c) => c[key])).size !== collection.length;
};
CollectionUtil.getMaxLengthPerKey = (collection = [], key) => {
    if (!key.length) {
        throw new exception_1.ApiBadRequestException('key is required');
    }
    const lastHash = {
        length: 0,
        key: null
    };
    collection.reduce((prev, next) => {
        const length = (prev[next[key]] = prev[next[key]] || []).push(next.name);
        if (length > lastHash.length) {
            lastHash.key = next.name;
            lastHash.length = length;
        }
        return prev;
    }, {});
    return lastHash;
};
//# sourceMappingURL=collection.js.map