"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters').optional(),
    phone: zod_1.z.string().optional(),
    profile: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional()
}).strict();
