import { Invitation, DeliveryChannel, InvitationDeliveryStatus } from '../models/Invitation';
import { Invitee, InvitationStatus } from '../models/Invitee';
import { Event } from '../models/Event';
import { generateSecureToken, hashToken } from '../utils/invitation.util';
import { generateQRCodeDataURL } from '../utils/qr.util';
import { sendEmail } from '../utils/email.provider';
import { env } from '../config/env';

export const invitationService = {
  async sendInvitations(eventId: string, organizerId: string, inviteeIds: string[], channel: DeliveryChannel) {
    const event = await Event.findOne({ _id: eventId, organizerId });
    if (!event) throw new Error('EVENT_NOT_FOUND');

    // Filter unique inviteeIds to prevent duplicate processing in one request
    const uniqueIds = [...new Set(inviteeIds)];
    const invitees = await Invitee.find({ _id: { $in: uniqueIds }, eventId });
    if (invitees.length !== uniqueIds.length) throw new Error('INVALID_INVITEES');

    const results = [];
    const baseUrl = process.env.INVITATION_BASE_URL || `${env.FRONTEND_URL}/invitation`;

    for (const invitee of invitees) {
      const rawToken = generateSecureToken();
      const tokenHash = hashToken(rawToken);
      const invitationUrl = `${baseUrl}/${rawToken}`;
      
      const invitation = new Invitation({
        eventId,
        inviteeId: invitee._id,
        channel,
        status: InvitationDeliveryStatus.PENDING,
        tokenHash
      });

      try {
        if (channel === DeliveryChannel.EMAIL) {
          if (!invitee.email) throw new Error('MISSING_EMAIL');
          
          const qrDataUrl = await generateQRCodeDataURL(invitationUrl);
          const htmlContent = `
            <h1>You are invited to ${event.title}!</h1>
            <p>Dear ${invitee.name},</p>
            <p>You have been invited to attend an event.</p>
            <p>Click <a href="${invitationUrl}">here</a> to view your invitation.</p>
            <p>Or scan the QR code below:</p>
            <img src="${qrDataUrl}" alt="Invitation QR Code" />
          `;
          
          await sendEmail(invitee.email, `Invitation: ${event.title}`, htmlContent);
          
          invitation.status = InvitationDeliveryStatus.SENT;
          invitation.sentAt = new Date();

          // Only update Invitee state on successful send
          invitee.qrTokenHash = tokenHash;
          invitee.invitationStatus = InvitationStatus.SENT;
        } else {
          throw new Error('CHANNEL_NOT_SUPPORTED_YET');
        }
      } catch (err: any) {
        invitation.status = InvitationDeliveryStatus.FAILED;
        invitation.failureReason = err.message === 'PROVIDER_NOT_CONFIGURED' ? 'Email provider not configured' : err.message;
        
        // If it's the first send attempt, mark invitee as FAILED
        if (invitee.invitationStatus === InvitationStatus.PENDING) {
          invitee.invitationStatus = InvitationStatus.FAILED;
        }
      }
      
      await invitation.save();
      await invitee.save();
      results.push({ inviteeId: invitee._id, status: invitation.status, failureReason: invitation.failureReason });
    }

    return results;
  },

  async resendInvitations(eventId: string, organizerId: string, invitationIds: string[]) {
    const event = await Event.findOne({ _id: eventId, organizerId });
    if (!event) throw new Error('EVENT_NOT_FOUND');

    const uniqueInvIds = [...new Set(invitationIds)];
    const invitations = await Invitation.find({ _id: { $in: uniqueInvIds }, eventId }).populate('inviteeId');
    if (invitations.length !== uniqueInvIds.length) throw new Error('INVALID_INVITATIONS');

    const results = [];
    const baseUrl = process.env.INVITATION_BASE_URL || `${env.FRONTEND_URL}/invitation`;

    for (const invitation of invitations) {
      const invitee = invitation.inviteeId as any;
      if (!invitee) {
        invitation.status = InvitationDeliveryStatus.FAILED;
        invitation.failureReason = 'INVITEE_DELETED';
        await invitation.save();
        results.push({ invitationId: invitation._id, status: 'FAILED', failureReason: 'INVITEE_DELETED' });
        continue;
      }

      // Generate a fresh token for the resend
      const rawToken = generateSecureToken();
      const tokenHash = hashToken(rawToken);
      const invitationUrl = `${baseUrl}/${rawToken}`;

      // Create a new delivery history record for the resend instead of overwriting the old one
      const resendInvitation = new Invitation({
        eventId,
        inviteeId: invitee._id,
        channel: invitation.channel,
        status: InvitationDeliveryStatus.PENDING,
        tokenHash
      });

      try {
        if (invitation.channel === DeliveryChannel.EMAIL) {
          if (!invitee.email) throw new Error('MISSING_EMAIL');
          
          const qrDataUrl = await generateQRCodeDataURL(invitationUrl);
          const htmlContent = `
            <h1>Reminder: You are invited to ${event.title}!</h1>
            <p>Dear ${invitee.name},</p>
            <p>This is a reminder for your invitation.</p>
            <p>Click <a href="${invitationUrl}">here</a> to view your invitation.</p>
            <p>Or scan the QR code below:</p>
            <img src="${qrDataUrl}" alt="Invitation QR Code" />
          `;
          
          await sendEmail(invitee.email, `Reminder: ${event.title}`, htmlContent);
          
          resendInvitation.status = InvitationDeliveryStatus.SENT;
          resendInvitation.sentAt = new Date();

          // Only overwrite the valid token in Invitee if the resend succeeds
          invitee.qrTokenHash = tokenHash;
          invitee.invitationStatus = InvitationStatus.SENT;
        } else {
          throw new Error('CHANNEL_NOT_SUPPORTED_YET');
        }
      } catch (err: any) {
        resendInvitation.status = InvitationDeliveryStatus.FAILED;
        resendInvitation.failureReason = err.message === 'PROVIDER_NOT_CONFIGURED' ? 'Email provider not configured' : err.message;
        // Do not overwrite invitee's existing qrTokenHash if resend fails
      }
      
      await resendInvitation.save();
      await invitee.save();
      results.push({ invitationId: resendInvitation._id, status: resendInvitation.status, failureReason: resendInvitation.failureReason });
    }

    return results;
  },

  async getInvitations(eventId: string, organizerId: string, page: number = 1, limit: number = 20) {
    const event = await Event.findOne({ _id: eventId, organizerId });
    if (!event) throw new Error('EVENT_NOT_FOUND');

    const skip = (page - 1) * limit;
    const invitations = await Invitation.find({ eventId })
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

    const total = await Invitation.countDocuments({ eventId });

    return {
      invitations: secureInvitations,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
};
