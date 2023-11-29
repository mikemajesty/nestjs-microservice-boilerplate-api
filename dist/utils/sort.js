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
    SortEnum: function() {
        return SortEnum;
    },
    SortHttpSchema: function() {
        return SortHttpSchema;
    },
    SortSchema: function() {
        return SortSchema;
    }
});
const _zod = require("zod");
var SortEnum;
(function(SortEnum) {
    SortEnum[SortEnum["asc"] = 1] = "asc";
    SortEnum[SortEnum["desc"] = -1] = "desc";
})(SortEnum || (SortEnum = {}));
const SortHttpSchema = _zod.z.string().optional().refine((check)=>{
    if (!check) return true;
    return [
        !check.startsWith(':'),
        check.includes(':')
    ].every(Boolean);
}, {
    message: 'invalidSortFormat'
}).refine((sort)=>{
    if (!sort) return true;
    return String(sort).split(',').every((s)=>{
        const [order] = s.split(':').reverse();
        return [
            'asc',
            'desc'
        ].includes(order.trim().toLowerCase() || 'asc');
    });
}, {
    message: 'invalidSortOrderMustBe: asc, desc'
}).transform((sort)=>{
    const sortDefault = sort || 'createdAt:desc';
    const order = Object.fromEntries(String(sort && !sort.includes('createdAt') ? sort : sortDefault).split(',').map((s)=>{
        const [field, order] = s.split(':');
        const sorted = [
            field.trim(),
            SortEnum[order.trim().toLowerCase() || 'asc']
        ];
        return sorted;
    }));
    return order;
});
const SortSchema = _zod.z.object({
    sort: _zod.z.record(_zod.z.string().trim().min(1), _zod.z.nativeEnum(SortEnum))
});

//# sourceMappingURL=sort.js.map