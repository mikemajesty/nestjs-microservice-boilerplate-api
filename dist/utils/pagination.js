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
    PaginationSchema: function() {
        return PaginationSchema;
    },
    calucaleSkip: function() {
        return calucaleSkip;
    }
});
const _zod = require("zod");
const maxLimit = (limit)=>limit > 100 ? 100 : limit;
const PaginationSchema = _zod.z.object({
    page: _zod.z.number().or(_zod.z.string()).or(_zod.z.nan()).default(1),
    limit: _zod.z.number().or(_zod.z.string()).or(_zod.z.nan()).default(10)
}).transform((pagination)=>{
    let limit = Number(pagination.limit);
    let page = Number(pagination.page);
    if (isNaN(limit)) {
        limit = 10;
    }
    if (isNaN(page)) {
        page = 1;
    }
    return {
        page: page > 0 ? +page : 1,
        limit: limit > 0 ? maxLimit(+limit) : 10
    };
}).refine((pagination)=>Number.isInteger(pagination.page), {
    path: [
        'page'
    ],
    message: 'invalidInteger'
}).refine((pagination)=>Number.isInteger(pagination.limit), {
    path: [
        'limit'
    ],
    message: 'invalidInteger'
});
const calucaleSkip = (input)=>{
    return (input.page - 1) * input.limit;
};

//# sourceMappingURL=pagination.js.map