import { Invitee, RsvpStatus } from '../models/Invitee';
import { Event } from '../models/Event';
import { hashToken } from '../utils/invitation.util';

export const publicInvitationService = {
  async getPublicInvitation(rawToken: string) {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new Error('INVALID_TOKEN');
    }

    const tokenHash = hashToken(rawToken);
    const invitee = await Invitee.findOne({ qrTokenHash: tokenHash }).populate('eventId', 'title description categoryId format location schedule');

    if (!invitee || !invitee.eventId) {
      throw new Error('INVITATION_NOT_FOUND');
    }

    const event = invitee.eventId as any;

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

  async submitRsvp(rawToken: string, rsvpStatus: RsvpStatus, dietaryPreference?: string) {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new Error('INVALID_TOKEN');
    }

    const tokenHash = hashToken(rawToken);
    const invitee = await Invitee.findOne({ qrTokenHash: tokenHash });

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
