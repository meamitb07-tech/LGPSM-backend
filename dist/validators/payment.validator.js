"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaymentSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
exports.createOrderSchema = zod_1.z.object({
    eventId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/),
    ticketTierId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/),
    quantity: zod_1.z.number().int().positive()
});
exports.verifyPaymentSchema = zod_1.z.object({
    providerOrderId: zod_1.z.string().min(1),
    providerPaymentId: zod_1.z.string().min(1),
    signature: zod_1.z.string().optional()
});
