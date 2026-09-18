import { z } from 'zod';
import { InvitationStatus, RsvpStatus } from '../models/Invitee';

export const createInviteeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    mobile: z.string().optional().or(z.literal('')),
    dietaryPreference: z.string().optional()
  }).refine(data => data.email || data.mobile, {
    message: 'Either email or mobile must be provided',
    path: ['email']
  })
});

export const updateInviteeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    mobile: z.string().optional().or(z.literal('')),
    dietaryPreference: z.string().optional()
    // Not allowing arbitrary changing of eventId or status fields in standard update
  }).refine(data => {
    // If both are explicitly set to empty, it's invalid. 
    // If we only update name, we don't need to enforce this since they exist on the DB side.
    return true; 
  })
});

export const updateSessionAccessSchema = z.object({
  body: z.object({
    sessionAccess: z.array(z.object({
      sessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID'),
      allowed: z.boolean()
    }))
  })
});

export const bulkUpdateSessionAccessSchema = z.object({
  body: z.object({
    inviteeIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid invitee ID')).min(1, 'At least one invitee required'),
    sessionAccess: z.array(z.object({
      sessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID'),
      allowed: z.boolean()
    }))
  })
});
