"use strict";
exports.__esModule = true;
exports.cashDrawerShiftSchema = void 0;
var schema_1 = require("../schema");
var cashDrawerDevice_1 = require("./cashDrawerDevice");
var money_1 = require("./money");
exports.cashDrawerShiftSchema = (0, schema_1.object)({
    id: ['id', (0, schema_1.optional)((0, schema_1.string)())],
    state: ['state', (0, schema_1.optional)((0, schema_1.string)())],
    openedAt: ['opened_at', (0, schema_1.optional)((0, schema_1.nullable)((0, schema_1.string)()))],
    endedAt: ['ended_at', (0, schema_1.optional)((0, schema_1.nullable)((0, schema_1.string)()))],
    closedAt: ['closed_at', (0, schema_1.optional)((0, schema_1.nullable)((0, schema_1.string)()))],
    employeeIds: ['employee_ids', (0, schema_1.optional)((0, schema_1.nullable)((0, schema_1.array)((0, schema_1.string)())))],
    openingEmployeeId: ['opening_employee_id', (0, schema_1.optional)((0, schema_1.nullable)((0, schema_1.string)()))],
    endingEmployeeId: ['ending_employee_id', (0, schema_1.optional)((0, schema_1.nullable)((0, schema_1.string)()))],
    closingEmployeeId: ['closing_employee_id', (0, schema_1.optional)((0, schema_1.nullable)((0, schema_1.string)()))],
    description: ['description', (0, schema_1.optional)((0, schema_1.nullable)((0, schema_1.string)()))],
    openedCashMoney: ['opened_cash_money', (0, schema_1.optional)((0, schema_1.lazy)(function () { return money_1.moneySchema; }))],
    cashPaymentMoney: ['cash_payment_money', (0, schema_1.optional)((0, schema_1.lazy)(function () { return money_1.moneySchema; }))],
    cashRefundsMoney: ['cash_refunds_money', (0, schema_1.optional)((0, schema_1.lazy)(function () { return money_1.moneySchema; }))],
    cashPaidInMoney: ['cash_paid_in_money', (0, schema_1.optional)((0, schema_1.lazy)(function () { return money_1.moneySchema; }))],
    cashPaidOutMoney: ['cash_paid_out_money', (0, schema_1.optional)((0, schema_1.lazy)(function () { return money_1.moneySchema; }))],
    expectedCashMoney: ['expected_cash_money', (0, schema_1.optional)((0, schema_1.lazy)(function () { return money_1.moneySchema; }))],
    closedCashMoney: ['closed_cash_money', (0, schema_1.optional)((0, schema_1.lazy)(function () { return money_1.moneySchema; }))],
    device: ['device', (0, schema_1.optional)((0, schema_1.lazy)(function () { return cashDrawerDevice_1.cashDrawerDeviceSchema; }))]
});
//# sourceMappingURL=cashDrawerShift.js.map