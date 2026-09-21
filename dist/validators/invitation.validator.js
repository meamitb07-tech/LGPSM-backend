"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendInvitationSchema = exports.sendInvitationSchema = void 0;
const zod_1 = require("zod");
const Invitation_1 = require("../models/Invitation");
exports.sendInvitationSchema = zod_1.z.object({
    body: zod_1.z.object({
        inviteeIds: zod_1.z.array(zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid invitee ID format')).min(1, 'At least one inviteeId is required'),
        channel: zod_1.z.nativeEnum(Invitation_1.DeliveryChannel)
    })
});
exports.resendInvitationSchema = zod_1.z.object({
    body: zod_1.z.object({
        invitationIds: zod_1.z.array(zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid invitation ID format')).min(1, 'At least one invitationId is required')
    })
});
