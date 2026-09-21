import { z } from 'zod';
import { RsvpStatus } from '../models/Invitee';

export const submitRsvpSchema = z.object({
  body: z.object({
    rsvpStatus: z.nativeEnum(RsvpStatus, {
      message: 'rsvpStatus must be ACCEPTED or DECLINED'
    }),
    dietaryPreference: z.string().max(100).optional()
  })
});
