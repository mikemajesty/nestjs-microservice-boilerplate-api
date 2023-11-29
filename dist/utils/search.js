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
    SearchHttpSchema: function() {
        return SearchHttpSchema;
    },
    SearchSchema: function() {
        return SearchSchema;
    }
});
const _zod = require("zod");
const SearchHttpSchema = _zod.z.string().optional().refine((check)=>{
    if (!check) return true;
    return [
        !check.startsWith(':'),
        check.includes(':')
    ].every(Boolean);
}, {
    message: 'invalidSearchFormat'
}).refine((search)=>{
    if (!search) return true;
    return String(search).split(',').every((s)=>{
        const [value] = s.split(':').reverse();
        if (!value) return false;
        return true;
    });
}, {
    message: 'searchMustBe: value'
}).transform((searchString)=>{
    if (!searchString) return null;
    const search = {};
    String(searchString).split(',').forEach((s)=>{
        const propertyIndex = s.indexOf(':');
        const value = s.slice(propertyIndex + 1, s.length);
        const [field] = s.split(':');
        search[`${field}`] = value.trim();
    });
    return search;
});
const SearchSchema = _zod.z.object({
    search: _zod.z.record(_zod.z.string().trim(), _zod.z.number().or(_zod.z.string())).nullable()
});

//# sourceMappingURL=search.js.map