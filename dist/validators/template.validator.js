"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTemplateSchema = exports.createTemplateSchema = void 0;
const zod_1 = require("zod");
exports.createTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    categoryId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    subcategoryId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    previewImageKey: zod_1.z.string().optional(),
    templateData: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    isSystemTemplate: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional()
});
exports.updateTemplateSchema = exports.createTemplateSchema.partial();
