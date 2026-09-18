"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateSessionAccessSchema = exports.updateSessionAccessSchema = exports.updateInviteeSchema = exports.createInviteeSchema = void 0;
const zod_1 = require("zod");
exports.createInviteeSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
        email: zod_1.z.string().email('Invalid email address').optional().or(zod_1.z.literal('')),
        mobile: zod_1.z.string().optional().or(zod_1.z.literal('')),
        dietaryPreference: zod_1.z.string().optional()
    }).refine(data => data.email || data.mobile, {
        message: 'Either email or mobile must be provided',
        path: ['email']
    })
});
exports.updateInviteeSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).optional(),
        email: zod_1.z.string().email('Invalid email address').optional().or(zod_1.z.literal('')),
        mobile: zod_1.z.string().optional().or(zod_1.z.literal('')),
        dietaryPreference: zod_1.z.string().optional()
        // Not allowing arbitrary changing of eventId or status fields in standard update
    }).refine(data => {
        // If both are explicitly set to empty, it's invalid. 
        // If we only update name, we don't need to enforce this since they exist on the DB side.
        return true;
    })
});
exports.updateSessionAccessSchema = zod_1.z.object({
    body: zod_1.z.object({
        sessionAccess: zod_1.z.array(zod_1.z.object({
            sessionId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID'),
            allowed: zod_1.z.boolean()
        }))
    })
});
exports.bulkUpdateSessionAccessSchema = zod_1.z.object({
    body: zod_1.z.object({
        inviteeIds: zod_1.z.array(zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid invitee ID')).min(1, 'At least one invitee required'),
        sessionAccess: zod_1.z.array(zod_1.z.object({
            sessionId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID'),
            allowed: zod_1.z.boolean()
        }))
    })
});
