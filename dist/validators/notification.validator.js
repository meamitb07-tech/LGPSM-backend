"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationSchema = void 0;
const zod_1 = require("zod");
exports.createNotificationSchema = zod_1.z.object({
    userId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/),
    type: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1).max(150),
    message: zod_1.z.string().min(1),
    entityType: zod_1.z.string().optional(),
    entityId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/).optional()
});
