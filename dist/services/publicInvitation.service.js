"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicInvitationService = void 0;
const Invitee_1 = require("../models/Invitee");
const invitation_util_1 = require("../utils/invitation.util");
exports.publicInvitationService = {
    async getPublicInvitation(rawToken) {
        if (!rawToken || typeof rawToken !== 'string') {
            throw new Error('INVALID_TOKEN');
        }
        const tokenHash = (0, invitation_util_1.hashToken)(rawToken);
        const invitee = await Invitee_1.Invitee.findOne({ qrTokenHash: tokenHash }).populate('eventId', 'title description categoryId format location schedule');
        if (!invitee || !invitee.eventId) {
            throw new Error('INVITATION_NOT_FOUND');
        }
        const event = invitee.eventId;
        return {
            event: {
                title: event.title,
                description: event.description,
                format: event.format,
                location: event.location,
                schedule: event.schedule
            },
            invitee: {
                name: invitee.name,
                rsvpStatus: invitee.rsvpStatus,
                dietaryPreference: invitee.dietaryPreference
            }
        };
    },
    async submitRsvp(rawToken, rsvpStatus, dietaryPreference) {
        if (!rawToken || typeof rawToken !== 'string') {
            throw new Error('INVALID_TOKEN');
        }
        const tokenHash = (0, invitation_util_1.hashToken)(rawToken);
        const invitee = await Invitee_1.Invitee.findOne({ qrTokenHash: tokenHash });
        if (!invitee) {
            throw new Error('INVITATION_NOT_FOUND');
        }
        invitee.rsvpStatus = rsvpStatus;
        if (dietaryPreference !== undefined) {
            invitee.dietaryPreference = dietaryPreference;
        }
        await invitee.save();
        return {
            message: 'RSVP submitted successfully',
            name: invitee.name,
            rsvpStatus: invitee.rsvpStatus,
            dietaryPreference: invitee.dietaryPreference
        };
    }
};
