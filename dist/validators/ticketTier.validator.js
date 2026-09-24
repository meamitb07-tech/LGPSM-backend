"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTicketTierSchema = exports.createTicketTierSchema = void 0;
const zod_1 = require("zod");
exports.createTicketTierSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    price: zod_1.z.number().min(0),
    currency: zod_1.z.string().optional(),
    capacity: zod_1.z.number().int().positive(),
    isActive: zod_1.z.boolean().optional()
});
exports.updateTicketTierSchema = exports.createTicketTierSchema.partial();
