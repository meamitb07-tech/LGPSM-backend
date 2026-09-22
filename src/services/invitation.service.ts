import mongoose from 'mongoose';
import { Event } from '../models/Event';
import { Invitee, InvitationStatus } from '../models/Invitee';
import { Invitation, DeliveryChannel, InvitationDeliveryStatus } from '../models/Invitation';
import { generateSecureToken, hashToken } from '../utils/invitation.util';
import { generateQRCodeDataURL } from '../utils/qr.util';
import { sendEmail } from '../utils/email.provider';
import { env } from '../config/env';

function buildFormalInvitationEmailHTML(params: {
  eventTitle: string;
  inviteeName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  dietaryPreference?: string;
  invitationUrl: string;
  cid: string;
  isReminder?: boolean;
}): string {
  const { eventTitle, inviteeName, eventDate, eventTime, venue, dietaryPreference, invitationUrl, cid, isReminder } = params;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${eventTitle}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F4F5F8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #F4F5F8; padding: 30px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); border: 1px solid #E5E7EB;">
              <!-- Header Bar -->
              <tr>
                <td style="background: linear-gradient(135deg, #FF5B22 0%, #E04B16 100%); padding: 32px 30px; text-align: center;">
                  <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.3;">
                    ${isReminder ? 'INVITATION REMINDER' : 'OFFICIAL INVITATION'}
                  </h1>
                  <p style="color: rgba(255, 255, 255, 0.9); margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">
                    ${eventTitle}
                  </p>
                </td>
              </tr>

              <!-- Greeting & Body -->
              <tr>
                <td style="padding: 30px 30px 10px 30px; color: #1F2937;">
                  <p style="font-size: 15px; margin: 0 0 12px 0; color: #111827;">Dear <strong>${inviteeName}</strong>,</p>
                  <p style="font-size: 13px; line-height: 1.6; color: #4B5563; margin: 0;">
                    ${isReminder 
                      ? `This is a friendly reminder of your upcoming invitation to <strong>${eventTitle}</strong>. We look forward to welcoming you.`
                      : `You are cordially invited to attend <strong>${eventTitle}</strong>. Below are your official event details and entry pass.`}
                  </p>
                </td>
              </tr>

              <!-- Event Details Box -->
              <tr>
                <td style="padding: 15px 30px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFF5F2; border: 1px solid #FFDCD1; border-radius: 10px; padding: 20px;">
                    <tr>
                      <td style="padding-bottom: 10px; font-size: 13px; color: #374151;">
                        <strong style="color: #FF5B22;">Event:</strong> ${eventTitle}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 10px; font-size: 13px; color: #374151;">
                        <strong style="color: #FF5B22;">Date:</strong> ${eventDate}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 10px; font-size: 13px; color: #374151;">
                        <strong style="color: #FF5B22;">Time:</strong> ${eventTime}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: ${dietaryPreference ? '10px' : '0px'}; font-size: 13px; color: #374151;">
                        <strong style="color: #FF5B22;">Venue:</strong> ${venue}
                      </td>
                    </tr>
                    ${dietaryPreference ? `
                    <tr>
                      <td style="font-size: 13px; color: #374151;">
                        <strong style="color: #FF5B22;">Dietary Preference:</strong> ${dietaryPreference}
                      </td>
                    </tr>
                    ` : ''}
                  </table>
                </td>
              </tr>

              <!-- Entry Pass QR Code Section -->
              <tr>
                <td align="center" style="padding: 20px 30px 30px 30px;">
                  <div style="background-color: #FFFFFF; border: 2px dashed #E5E7EB; border-radius: 12px; padding: 25px; display: inline-block; max-width: 260px;">
                    <p style="font-size: 12px; font-weight: 700; color: #111827; margin: 0 0 12px 0; text-transform: uppercase;">
                      Official Entry QR Pass
                    </p>
                    <img src="cid:${cid}" alt="Entry Pass QR Code" width="190" height="190" style="display: block; margin: 0 auto; border-radius: 6px; border: 1px solid #F3F4F6;" />
                    <p style="font-size: 11px; color: #6B7280; margin: 12px 0 0 0; line-height: 1.4;">
                      Please present this QR code at the check-in desk for entry validation.
                    </p>
                  </div>

                  <!-- Online Pass Button -->
                  <div style="margin-top: 25px;">
                    <a href="${invitationUrl}" target="_blank" style="background-color: #FF5B22; color: #FFFFFF; text-decoration: none; padding: 12px 28px; font-size: 13px; font-weight: 700; border-radius: 6px; display: inline-block;">
                      Access Digital Pass
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer Section -->
              <tr>
                <td style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF;">
                  <p style="margin: 0 0 4px 0;">Organized via <strong>LGPSM Platform</strong></p>
                  <p style="margin: 0;">If you have any questions, please contact the event organizer.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export const invitationService = {
  async sendInvitations(eventId: string, organizerId: string, inviteeIds: string[], channel: DeliveryChannel) {
    const event = await Event.findOne({ _id: eventId, organizerId });
    if (!event) throw new Error('EVENT_NOT_FOUND');

    // Filter unique inviteeIds to prevent duplicate processing in one request
    const idsArray = Array.isArray(inviteeIds) ? inviteeIds : typeof inviteeIds === "string" ? [inviteeIds] : [];
    const validObjectIds = idsArray
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validObjectIds.length === 0) throw new Error('INVALID_INVITEES');

    const invitees = await Invitee.find({ _id: { $in: validObjectIds }, eventId });
    if (invitees.length === 0) throw new Error('INVALID_INVITEES');

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
          const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
          
          const eventDate = event.schedule?.start
            ? new Date(event.schedule.start).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'To Be Announced';

          const eventTime = event.schedule?.start
            ? new Date(event.schedule.start).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'To Be Announced';

          const venue = event.format === 'VIRTUAL'
            ? 'Virtual Event'
            : (event.location?.address || 'Venue details to be announced');

          const cid = `invitation-qr-${invitee._id}`;

          const htmlContent = buildFormalInvitationEmailHTML({
            eventTitle: event.title,
            inviteeName: invitee.name,
            eventDate,
            eventTime,
            venue,
            dietaryPreference: invitee.dietaryPreference,
            invitationUrl,
            cid,
            isReminder: false,
          });

          const attachments = [
            {
              filename: 'invitation-qr.png',
              content: Buffer.from(base64Data, 'base64'),
              cid,
              contentType: 'image/png'
            }
          ];

          await sendEmail(invitee.email, `Invitation: ${event.title}`, htmlContent, attachments);
          
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

    const idsArray = Array.isArray(invitationIds) ? invitationIds : typeof invitationIds === "string" ? [invitationIds] : [];
    const validObjectIds = idsArray
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validObjectIds.length === 0) throw new Error('INVALID_INVITATIONS');

    const invitations = await Invitation.find({ _id: { $in: validObjectIds }, eventId }).populate('inviteeId');
    if (invitations.length === 0) throw new Error('INVALID_INVITATIONS');

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
          const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
          
          const eventDate = event.schedule?.start
            ? new Date(event.schedule.start).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'To Be Announced';

          const eventTime = event.schedule?.start
            ? new Date(event.schedule.start).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'To Be Announced';

          const venue = event.format === 'VIRTUAL'
            ? 'Virtual Event'
            : (event.location?.address || 'Venue details to be announced');

          const cid = `invitation-qr-${invitee._id}`;

          const htmlContent = buildFormalInvitationEmailHTML({
            eventTitle: event.title,
            inviteeName: invitee.name,
            eventDate,
            eventTime,
            venue,
            dietaryPreference: invitee.dietaryPreference,
            invitationUrl,
            cid,
            isReminder: true,
          });

          const attachments = [
            {
              filename: 'invitation-qr.png',
              content: Buffer.from(base64Data, 'base64'),
              cid,
              contentType: 'image/png'
            }
          ];

          await sendEmail(invitee.email, `Reminder: ${event.title}`, htmlContent, attachments);
          
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
    const secureInvitations = invitations.map((inv: any) => {
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
