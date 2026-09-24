"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100),
    description: zod_1.z.string().optional(),
    subcategories: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1),
        isActive: zod_1.z.boolean().optional()
    })).optional(),
    isActive: zod_1.z.boolean().optional()
});
exports.updateCategorySchema = exports.createCategorySchema.partial();
