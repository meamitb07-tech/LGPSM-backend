"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAssignmentSchema = exports.createAssignmentSchema = void 0;
const zod_1 = require("zod");
exports.createAssignmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
        sessionIds: zod_1.z.array(zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID')).default([])
    })
});
exports.updateAssignmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        sessionIds: zod_1.z.array(zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID'))
    })
});
