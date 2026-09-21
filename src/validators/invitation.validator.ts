import { z } from 'zod';
import { DeliveryChannel } from '../models/Invitation';

export const sendInvitationSchema = z.object({
  body: z.object({
    inviteeIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid invitee ID format')).min(1, 'At least one inviteeId is required'),
    channel: z.nativeEnum(DeliveryChannel)
  })
});

export const resendInvitationSchema = z.object({
  body: z.object({
    invitationIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid invitation ID format')).min(1, 'At least one invitationId is required')
  })
});
