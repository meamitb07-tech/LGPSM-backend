"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presignMediaSchema = void 0;
const zod_1 = require("zod");
exports.presignMediaSchema = zod_1.z.object({
    body: zod_1.z.object({
        fileName: zod_1.z.string().min(1, 'File name is required').regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid file name characters'),
        fileType: zod_1.z.enum(['image/jpeg', 'image/png'], {
            message: 'Only image/jpeg and image/png are supported'
        })
    })
});
