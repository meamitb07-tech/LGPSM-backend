"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationService = void 0;
const Invitation_1 = require("../models/Invitation");
const Invitee_1 = require("../models/Invitee");
const Event_1 = require("../models/Event");
const invitation_util_1 = require("../utils/invitation.util");
const qr_util_1 = require("../utils/qr.util");
const email_provider_1 = require("../utils/email.provider");
const env_1 = require("../config/env");
exports.invitationService = {
    async sendInvitations(eventId, organizerId, inviteeIds, channel) {
        const event = await Event_1.Event.findOne({ _id: eventId, organizerId });
        if (!event)
            throw new Error('EVENT_NOT_FOUND');
        // Filter unique inviteeIds to prevent duplicate processing in one request
        const uniqueIds = [...new Set(inviteeIds)];
        const invitees = await Invitee_1.Invitee.find({ _id: { $in: uniqueIds }, eventId });
        if (invitees.length !== uniqueIds.length)
            throw new Error('INVALID_INVITEES');
        const results = [];
        const baseUrl = process.env.INVITATION_BASE_URL || `${env_1.env.FRONTEND_URL}/invitation`;
        for (const invitee of invitees) {
            const rawToken = (0, invitation_util_1.generateSecureToken)();
            const tokenHash = (0, invitation_util_1.hashToken)(rawToken);
            const invitationUrl = `${baseUrl}/${rawToken}`;
            const invitation = new Invitation_1.Invitation({
                eventId,
                inviteeId: invitee._id,
                channel,
                status: Invitation_1.InvitationDeliveryStatus.PENDING,
                tokenHash
            });
            try {
                if (channel === Invitation_1.DeliveryChannel.EMAIL) {
                    if (!invitee.email)
                        throw new Error('MISSING_EMAIL');
                    const qrDataUrl = await (0, qr_util_1.generateQRCodeDataURL)(invitationUrl);
                    const htmlContent = `
            <h1>You are invited to ${event.title}!</h1>
            <p>Dear ${invitee.name},</p>
            <p>You have been invited to attend an event.</p>
            <p>Click <a href="${invitationUrl}">here</a> to view your invitation.</p>
            <p>Or scan the QR code below:</p>
            <img src="${qrDataUrl}" alt="Invitation QR Code" />
          `;
                    await (0, email_provider_1.sendEmail)(invitee.email, `Invitation: ${event.title}`, htmlContent);
                    invitation.status = Invitation_1.InvitationDeliveryStatus.SENT;
                    invitation.sentAt = new Date();
                    // Only update Invitee state on successful send
                    invitee.qrTokenHash = tokenHash;
                    invitee.invitationStatus = Invitee_1.InvitationStatus.SENT;
                }
                else {
                    throw new Error('CHANNEL_NOT_SUPPORTED_YET');
                }
            }
            catch (err) {
                invitation.status = Invitation_1.InvitationDeliveryStatus.FAILED;
                invitation.failureReason = err.message === 'PROVIDER_NOT_CONFIGURED' ? 'Email provider not configured' : err.message;
                // If it's the first send attempt, mark invitee as FAILED
                if (invitee.invitationStatus === Invitee_1.InvitationStatus.PENDING) {
                    invitee.invitationStatus = Invitee_1.InvitationStatus.FAILED;
                }
            }
            await invitation.save();
            await invitee.save();
            results.push({ inviteeId: invitee._id, status: invitation.status, failureReason: invitation.failureReason });
        }
        return results;
    },
    async resendInvitations(eventId, organizerId, invitationIds) {
        const event = await Event_1.Event.findOne({ _id: eventId, organizerId });
        if (!event)
            throw new Error('EVENT_NOT_FOUND');
        const uniqueInvIds = [...new Set(invitationIds)];
        const invitations = await Invitation_1.Invitation.find({ _id: { $in: uniqueInvIds }, eventId }).populate('inviteeId');
        if (invitations.length !== uniqueInvIds.length)
            throw new Error('INVALID_INVITATIONS');
        const results = [];
        const baseUrl = process.env.INVITATION_BASE_URL || `${env_1.env.FRONTEND_URL}/invitation`;
        for (const invitation of invitations) {
            const invitee = invitation.inviteeId;
            if (!invitee) {
                invitation.status = Invitation_1.InvitationDeliveryStatus.FAILED;
                invitation.failureReason = 'INVITEE_DELETED';
                await invitation.save();
                results.push({ invitationId: invitation._id, status: 'FAILED', failureReason: 'INVITEE_DELETED' });
                continue;
            }
            // Generate a fresh token for the resend
            const rawToken = (0, invitation_util_1.generateSecureToken)();
            const tokenHash = (0, invitation_util_1.hashToken)(rawToken);
            const invitationUrl = `${baseUrl}/${rawToken}`;
            // Create a new delivery history record for the resend instead of overwriting the old one
            const resendInvitation = new Invitation_1.Invitation({
                eventId,
                inviteeId: invitee._id,
                channel: invitation.channel,
                status: Invitation_1.InvitationDeliveryStatus.PENDING,
                tokenHash
            });
            try {
                if (invitation.channel === Invitation_1.DeliveryChannel.EMAIL) {
                    if (!invitee.email)
                        throw new Error('MISSING_EMAIL');
                    const qrDataUrl = await (0, qr_util_1.generateQRCodeDataURL)(invitationUrl);
                    const htmlContent = `
            <h1>Reminder: You are invited to ${event.title}!</h1>
            <p>Dear ${invitee.name},</p>
            <p>This is a reminder for your invitation.</p>
            <p>Click <a href="${invitationUrl}">here</a> to view your invitation.</p>
            <p>Or scan the QR code below:</p>
            <img src="${qrDataUrl}" alt="Invitation QR Code" />
          `;
                    await (0, email_provider_1.sendEmail)(invitee.email, `Reminder: ${event.title}`, htmlContent);
                    resendInvitation.status = Invitation_1.InvitationDeliveryStatus.SENT;
                    resendInvitation.sentAt = new Date();
                    // Only overwrite the valid token in Invitee if the resend succeeds
                    invitee.qrTokenHash = tokenHash;
                    invitee.invitationStatus = Invitee_1.InvitationStatus.SENT;
                }
                else {
                    throw new Error('CHANNEL_NOT_SUPPORTED_YET');
                }
            }
            catch (err) {
                resendInvitation.status = Invitation_1.InvitationDeliveryStatus.FAILED;
                resendInvitation.failureReason = err.message === 'PROVIDER_NOT_CONFIGURED' ? 'Email provider not configured' : err.message;
                // Do not overwrite invitee's existing qrTokenHash if resend fails
            }
            await resendInvitation.save();
            await invitee.save();
            results.push({ invitationId: resendInvitation._id, status: resendInvitation.status, failureReason: resendInvitation.failureReason });
        }
        return results;
    },
    async getInvitations(eventId, organizerId, page = 1, limit = 20) {
        const event = await Event_1.Event.findOne({ _id: eventId, organizerId });
        if (!event)
            throw new Error('EVENT_NOT_FOUND');
        const skip = (page - 1) * limit;
        const invitations = await Invitation_1.Invitation.find({ eventId })
            .populate('inviteeId', 'name email mobile invitationStatus rsvpStatus')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();
        // Strip tokenHash from response for security
        const secureInvitations = invitations.map(inv => {
            const { tokenHash, ...rest } = inv;
            return rest;
        });
        const total = await Invitation_1.Invitation.countDocuments({ eventId });
        return {
            invitations: secureInvitations,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }
};
