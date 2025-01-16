"use strict";
exports.__esModule = true;
exports.listCashDrawerShiftsResponseSchema = void 0;
var schema_1 = require("../schema");
var cashDrawerShiftSummary_1 = require("./cashDrawerShiftSummary");
var error_1 = require("./error");
exports.listCashDrawerShiftsResponseSchema = (0, schema_1.object)({
    items: ['items', (0, schema_1.optional)((0, schema_1.array)((0, schema_1.lazy)(function () { return cashDrawerShiftSummary_1.cashDrawerShiftSummarySchema; })))],
    cursor: ['cursor', (0, schema_1.optional)((0, schema_1.string)())],
    errors: ['errors', (0, schema_1.optional)((0, schema_1.array)((0, schema_1.lazy)(function () { return error_1.errorSchema; })))]
});
//# sourceMappingURL=listCashDrawerShiftsResponse.js.map